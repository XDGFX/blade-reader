# 2D steady-state sheet model of one Blade Reader strip. Units: mm, W, K (rise over ambient).
import numpy as np, scipy.sparse as sp, scipy.sparse.linalg as spl
D = 0.25                       # grid, mm
import os
OZ = float(os.environ.get('OZ', '1'))
KT_CU = 385*2*0.035e-3*OZ      # W/K per square: 2 layers x 35 um copper per oz
KT_FR4 = 0.3*1.6e-3            # FR-4 through the board thickness, laterally
PITCH = 13.36
C = [6.68 + PITCH*k for k in range(6)]
AMB = 25.0

def build(gap=0.5):
    xs = np.arange(0, 80.16, D) + D/2
    ys = np.arange(-13, 40, D) + D/2
    X, Y = np.meshgrid(xs, ys, indexing='ij')
    board = (Y >= 0)
    for c in C:
        board |= (np.abs(X-c) <= 4.75) & (Y < 0)
    for k in range(1, 6):
        board &= ~((np.abs(X-PITCH*k) <= 0.85) & (Y >= 10.5) & (Y <= 21.5))   # NPTH slots
    board &= ~((np.abs(X-40.08) <= 6.6) & (Y >= 35))                          # antenna notch
    for c in C:
        board &= ~(np.hypot(X-c, Y+8.5) < 2.7)                                # screw hole
    kt = np.where(board, KT_CU, 0.0)
    g = gap/2
    for k in range(1, 6):   # clearance between ways' pours in the sensor band
        kt[board & (np.abs(X-PITCH*k) <= g) & (Y >= 0) & (Y <= 10.5)] = KT_FR4
    kt[board & (np.abs(Y-22.0) <= g)] = KT_FR4    # way copper ends, GND pour starts
    isl = (np.abs(X-40.08) <= 1.5) & (Y >= 1.5) & (Y <= 9) & board
    ring = (np.abs(X-40.08) <= 1.5+gap) & (Y >= 1.5-gap) & (Y <= 9+gap) & ~isl & board
    kt[ring] = KT_FR4
    return X, Y, board, kt, isl

def solve(I, h=10.0, Rs25=0.5, Rcu20=0.75, dTwire30=15.0, dTpanel30=20.0, Gw=0.02, Gp=0.10,
          Pesp=0.3, gap=0.5, iters=6):
    X, Y, board, kt, isl = build(gap)
    nx, ny = X.shape
    idx = -np.ones(X.shape, int); idx[board] = np.arange(board.sum()); N = board.sum()
    cellA = (D*1e-3)**2
    rows, cols, vals = [], [], []
    for (dx, dy) in [(1, 0), (0, 1)]:
        a = board[:nx-dx, :ny-dy] & board[dx:, dy:]
        k1 = kt[:nx-dx, :ny-dy][a]; k2 = kt[dx:, dy:][a]
        g = 2*k1*k2/(k1+k2)
        i1 = idx[:nx-dx, :ny-dy][a]; i2 = idx[dx:, dy:][a]
        rows += [i1, i2, i1, i2]; cols += [i2, i1, i1, i2]; vals += [-g, -g, g, g]
    K = sp.csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(N, N))
    K = K + sp.diags(2*h*cellA*np.ones(N))
    Gx = np.zeros(N); Tb = np.zeros(N)
    sens, path, nut = [], [], []
    for k, c in enumerate(C):
        s = board & (np.abs(X-c) <= 2.0) & (np.abs(Y-5.25) <= 2.5); sens.append(s)
        p = board & (np.abs(X-c) <= 4.75) & (Y >= -8.5) & (Y <= 16) & ~s; path.append(p)
        n = board & (np.hypot(X-c, Y-16) <= 4.37); nut.append(n)
        cl = board & (np.hypot(X-c, Y+8.5) <= 4.1)
        Tw = dTwire30*(I[k]/30)**2; Tp = dTpanel30*(I[k]/30)**2
        Gx[idx[n]] += Gw/n.sum(); Tb[idx[n]] += Gw/n.sum()*Tw
        Gx[idx[cl]] += Gp/cl.sum(); Tb[idx[cl]] += Gp/cl.sum()*Tp
    K = K + sp.diags(Gx)
    esp = board & (np.abs(X-40.08) <= 6.6) & (Y >= 23.4)
    T = np.zeros(N)
    lu = spl.factorized(K.tocsc())
    for _ in range(iters):
        q = Tb.copy()
        q[idx[esp]] += Pesp/esp.sum()
        P = []
        for k in range(6):
            Ts = T[idx[sens[k]]].mean(); Tpth = T[idx[path[k]]].mean()
            Ps = I[k]**2*Rs25*1e-3*(1+0.0039*(Ts+AMB-25))
            Pc = I[k]**2*Rcu20*1e-3*(1+0.00393*(Tpth+AMB-20))
            q[idx[sens[k]]] += Ps/sens[k].sum(); q[idx[path[k]]] += Pc/path[k].sum()
            P.append((Ps, Pc))
        T = lu(q)
    return dict(sens=[T[idx[s]].max() for s in sens], nut=[T[idx[n]].mean() for n in nut],
                isl=T[idx[isl]].mean(), esp_max=T[idx[esp]].max(), esp_mean=T[idx[esp]].mean(),
                P=P, Ptot=sum(a+b for a, b in P)+Pesp)

def show(name, I, **kw):
    o = solve(I, **kw)
    f = lambda v: ' '.join(f'{t:5.1f}' for t in v)
    print(f"{name:26s} P {o['Ptot']:4.1f} W | sensors {f(o['sens'])} | nuts {f(o['nut'])} | MMBT {o['isl']:5.1f} | ESP max {o['esp_max']:5.1f} mean {o['esp_mean']:5.1f}")
    return o

S = {
    'A 6x30 A': [30]*6,
    'B 30,30,30,10,0,0': [30, 30, 30, 10, 0, 0],
    'B2 0,30,30,30,10,0': [0, 30, 30, 30, 10, 0],
    'C way 1 alone 30 A': [30, 0, 0, 0, 0, 0],
    'C2 way 3 alone 30 A': [0, 0, 30, 0, 0, 0],
    'D 8.3 A each': [100/12]*6,
    'E 16.7 A each': [100/6]*6,
    'F idle': [0]*6,
}
CASES = [('central', {}),
         ('pessimistic: h 7, Rs 0.6, Rcu 1.0, panel 40 K, wire 25 K', dict(h=7, Rs25=0.6, Rcu20=1.0, dTpanel30=40, dTwire30=25)),
         ('optimistic: h 12, Rcu 0.5, panel and wire as cold sinks', dict(h=12, Rcu20=0.5, dTpanel30=0, dTwire30=0)),
         ('central but sinks 3x stronger (Gw .06, Gp .3)', dict(Gw=0.06, Gp=0.3))]
for case, kw in CASES:
    print('==', case)
    for n, I in S.items():
        if case != 'central' and n not in ('A 6x30 A', 'B 30,30,30,10,0,0', 'B2 0,30,30,30,10,0', 'C way 1 alone 30 A', 'E 16.7 A each'):
            continue
        show(n, I, **kw)
o = solve([30]*6)
print('per-way losses at 6x30 central (sensor, copper) W:', [(round(a, 2), round(b, 2)) for a, b in o['P']])
