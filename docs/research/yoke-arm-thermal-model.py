# 2D steady-state sheet model of the rev A strip and of the yoke, by the method of the rev A
# estimate (strip-thermal-model.py on research/strip-thermal). Units: mm, W, K (rise over ambient).
# Run: uv run --with numpy --with scipy python docs/research/yoke-arm-thermal-model.py
import numpy as np, scipy.sparse as sp, scipy.sparse.linalg as spl

D = 0.25                       # grid, mm
KT_FR4 = 0.3*1.6e-3            # FR-4 through the board thickness, laterally
PITCH = 13.36
AMB = 25.0
kt_cu = lambda oz: 385*2*0.035e-3*oz   # W/K per square: two faces of 35 um copper per oz


def strip(depth=40.0, nut_y=16.0, slots=True, module=True, oz=1.0, gap=0.5):
    """Rev A's comb. The defaults are the geometry the rev A estimate was run on."""
    C = [6.68 + PITCH*k for k in range(6)]
    xs = np.arange(0, 80.16, D) + D/2
    ys = np.arange(-13, depth, D) + D/2
    X, Y = np.meshgrid(xs, ys, indexing='ij')
    board = (Y >= 0)
    for c in C:
        board |= (np.abs(X-c) <= 4.75) & (Y < 0)
    if slots:
        for k in range(1, 6):
            board &= ~((np.abs(X-PITCH*k) <= 0.85) & (Y >= 10.5) & (Y <= 21.5))
    if module:
        board &= ~((np.abs(X-40.08) <= 6.6) & (Y >= 35))                      # antenna notch
    for c in C:
        board &= ~(np.hypot(X-c, Y+8.5) < 2.7)                                # screw hole
    kt = np.where(board, kt_cu(oz), 0.0)
    g = gap/2
    for k in range(1, 6):   # clearance between ways' pours in the sensor band
        kt[board & (np.abs(X-PITCH*k) <= g) & (Y >= 0) & (Y <= 10.5)] = KT_FR4
    kt[board & (np.abs(Y-22.0) <= g)] = KT_FR4    # way copper ends, GND pour starts
    isl = (np.abs(X-40.08) <= 1.5) & (Y >= 1.5) & (Y <= 9) & board
    ring = (np.abs(X-40.08) <= 1.5+gap) & (Y >= 1.5-gap) & (Y <= 9+gap) & ~isl & board
    kt[ring] = KT_FR4
    ways = []
    for c in C:
        s = board & (np.abs(X-c) <= 2.0) & (np.abs(Y-5.25) <= 2.5)
        ways.append(dict(sens=s,
                         path=board & (np.abs(X-c) <= 4.75) & (Y >= -8.5) & (Y <= nut_y) & ~s,
                         nut=board & (np.hypot(X-c, Y-nut_y) <= 4.37),
                         clamp=board & (np.hypot(X-c, Y+8.5) <= 4.1)))
    esp = board & (np.abs(X-40.08) <= 6.6) & (Y >= 23.4) if module else np.zeros_like(board)
    return dict(board=board, kt=kt, ways=ways, module=esp, probes={},
                share=13.36*depth + 9.5*13)


# The yoke, from board/yoke.circuit.tsx on explore/yoke. A runs along the panel from its
# positive end, C across from the centreline, O outboard of the panel edge on either arm.
HALF, ARM, NUT_OUT, CLAMP_IN = 42.1, 16.7, 10.68, 8.52
WAYS_A = [27.83 + PITCH*k for k in range(6)]          # nearest the chin first
A_OPEN, A_EAR, A_OUTER = WAYS_A[5] + PITCH/2, 27.83 - 11.93, -20.95
PANEL_END = np.array([[0, .05], [4.5, .05], [13, .41], [20, 1.0], [25, 1.56], [30, 2.21], [35, 3.04],
                      [38, 3.56], [39, 3.77], [39.5, 3.91], [40, 4.18], [40.5, 4.48], [41, 4.9],
                      [41.5, 5.48], [42, 6.43], [42.1, 8], [43.1, 8]])


def yoke(oz=1.0, gap=0.5, module_shift=0.0, lane_oz=None):
    """Both arms and the chin. Each way's sensor is beside its finger, on the chin side (#65)."""
    a = np.arange(A_OUTER, A_OPEN, D) + D/2
    c = np.arange(-(HALF+ARM), HALF+ARM, D) + D/2
    A, Cc = np.meshgrid(a, c, indexing='ij')
    AC = np.abs(Cc); O = AC - HALF
    inner = np.interp(AC, PANEL_END[:, 0], PANEL_END[:, 1]) - 1.0      # chin's inner edge
    board = ((AC <= HALF+1) & (A < inner)) | ((AC > HALF+1) & (A < A_EAR+1)) | ((O >= 0) & (A >= A_EAR+1))
    for w in WAYS_A:
        board |= (np.abs(A-w) <= 4.75) & (O < 0) & (O >= -13)
    board &= ~(A < A_OUTER + 12*(AC-23.8)/35)                          # chin's chamfers
    board &= ~((AC-(HALF+ARM-4)) + (A-(A_OPEN-4)) > 4)                 # open-end chamfers
    for w in WAYS_A:
        board &= ~(np.hypot(A-w, O+CLAMP_IN) < 2.7)
    kt = np.where(board, kt_cu(oz), 0.0)
    if lane_oz is not None:   # the ring face under the sensors is the channel: signal lanes, not pour
        kt[board & (O >= 1.3) & (O <= 6.0) & (A >= A_EAR)] = kt_cu(lane_oz)
    h = gap/2
    ways = []
    for side in (1, -1):
        on = Cc*side > 0
        for w in WAYS_A:
            g = w - PITCH/2                                            # this way's sensor
            # The way's copper is cut from the one nearer the chin (or the chin's ground) on the
            # sensor's signal side, then between the two nuts.
            kt[board & on & (np.abs(A-(g-2.5)) <= h) & (O >= 0) & (O <= 7)] = KT_FR4
            kt[board & on & (A >= g-2.5-h) & (A <= g+h) & (np.abs(O-7) <= h)] = KT_FR4
            kt[board & on & (np.abs(A-g) <= h) & (O >= 7)] = KT_FR4
            kt[board & on & (A >= g-2.75) & (A <= g-1.68) & (O >= 0) & (O <= gap)] = KT_FR4
            s = board & on & (np.abs(A-g) <= 2.0) & (np.abs(O-4.0) <= 2.5)
            p = board & on & ~s & (((np.abs(A-w) <= 4.75) & (O >= -CLAMP_IN) & (O < 0))
                                   | ((A >= g+2) & (A <= w+2.93) & (O >= 0) & (O <= 7))
                                   | ((np.abs(A-w) <= 2.93) & (O > 7) & (O <= NUT_OUT)))
            ways.append(dict(sens=s, path=p,
                             nut=board & on & (np.hypot(A-w, O-NUT_OUT) <= 4.37),
                             clamp=board & on & (np.hypot(A-w, O+CLAMP_IN) <= 4.1)))
    # The module on the +C chamfer: 18 wide, 14 of its 20 on the board, 4 towards the side edge
    # from the chamfer's middle (as the outline draws the MINI-1). module_shift slides it along
    # the chamfer towards the arm.
    L = np.hypot(35, 12); u = (35/L, 12/L); n = (-12/L, 35/L)
    dc, da = Cc - (HALF+ARM-17.5), A - (A_OUTER+6)
    sa, t = dc*u[0] + da*u[1], dc*n[0] + da*n[1]
    mod = board & (np.abs(sa-4-module_shift) <= 9) & (t >= 0) & (t <= 14)
    # Board temperature across the arm's root, by distance towards the chin from the nearest
    # sensor's body (its edge is at A = 19.15).
    probes = {f'{d} mm': board & (Cc > HALF+1) & (np.abs(A-(19.15-d)) <= 0.5) for d in (2, 5, 10, 15, 20, 25, 30)}
    return dict(board=board, kt=kt, ways=ways, module=mod, probes=probes, share=PITCH*ARM + 9.5*13)


def solve(geo, I, h=10.0, Rs25=0.5, Rcu20=0.75, dTwire30=15.0, dTpanel30=20.0, Gw=0.02, Gp=0.10,
          Pmod=0.3, iters=6):
    board, kt, ways, mod = geo['board'], geo['kt'], geo['ways'], geo['module']
    nx, ny = board.shape
    N = board.sum(); idx = -np.ones(board.shape, int); idx[board] = np.arange(N)
    cellA = (D*1e-3)**2
    rows, cols, vals = [], [], []
    for (dx, dy) in [(1, 0), (0, 1)]:
        a = board[:nx-dx, :ny-dy] & board[dx:, dy:]
        k1 = kt[:nx-dx, :ny-dy][a]; k2 = kt[dx:, dy:][a]
        g = 2*k1*k2/(k1+k2)
        i1 = idx[:nx-dx, :ny-dy][a]; i2 = idx[dx:, dy:][a]
        rows += [i1, i2, i1, i2]; cols += [i2, i1, i1, i2]; vals += [-g, -g, g, g]
    K = sp.csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(N, N))
    Gx = np.zeros(N); Tb = np.zeros(N)
    for k, w in enumerate(ways):
        n, cl = w['nut'], w['clamp']
        Tw = dTwire30*(I[k]/30)**2; Tp = dTpanel30*(I[k]/30)**2
        Gx[idx[n]] += Gw/n.sum(); Tb[idx[n]] += Gw/n.sum()*Tw
        Gx[idx[cl]] += Gp/cl.sum(); Tb[idx[cl]] += Gp/cl.sum()*Tp
    K = K + sp.diags(2*h*cellA*np.ones(N) + Gx)
    lu = spl.factorized(K.tocsc())
    T = np.zeros(N)
    for _ in range(iters):
        q = Tb.copy()
        if mod.any():
            q[idx[mod]] += Pmod/mod.sum()
        P = []
        for k, w in enumerate(ways):
            Ts = T[idx[w['sens']]].mean(); Tpth = T[idx[w['path']]].mean()
            Ps = I[k]**2*Rs25*1e-3*(1+0.0039*(Ts+AMB-25))
            Pc = I[k]**2*Rcu20*1e-3*(1+0.00393*(Tpth+AMB-20))
            q[idx[w['sens']]] += Ps/w['sens'].sum(); q[idx[w['path']]] += Pc/w['path'].sum()
            P.append((Ps, Pc))
        T = lu(q)
    return dict(sens=[T[idx[w['sens']]].max() for w in ways], nut=[T[idx[w['nut']]].mean() for w in ways],
                mod=T[idx[mod]].max() if mod.any() else float('nan'),
                probes={k: T[idx[m]].max() for k, m in geo['probes'].items()},
                P=P, Ptot=sum(a+b for a, b in P) + (Pmod if mod.any() else 0))


def show(name, geo, I, **kw):
    o = solve(geo, I, **kw)
    f = lambda v: ' '.join(f'{t:5.1f}' for t in v)
    hot = int(np.argmax(o['sens']))
    print(f"{name:34s} P {o['Ptot']:5.1f} W | sensors {f(o['sens'])} | nuts {f(o['nut'])} | module {o['mod']:5.1f}"
          f" | hottest way W {o['P'][hot][0]:.2f}+{o['P'][hot][1]:.2f}")
    if o['probes']:
        print(' '*34, 'root, from the nearest sensor:', ', '.join(f'{k} {v:.1f}' for k, v in o['probes'].items()))
    return o


PESS = dict(h=7, Rs25=0.6, dTpanel30=40, dTwire30=25)
OPT = dict(h=12, dTpanel30=0, dTwire30=0)
z = [0]*6

print('#### Rev A strip')
for label, kw in [('as estimated: 40 body, nuts 16', {}),
                  ('25.5 body, nuts 14, no slots', dict(depth=25.5, nut_y=14, slots=False, module=False)),
                  ('28.0 body, nuts 14, no slots', dict(depth=28.0, nut_y=14, slots=False, module=False))]:
    geo = strip(**kw)
    print(f'== {label}: board share per way {geo["share"]:.0f} mm2')
    for cur in (30, 20):
        show(f'six at {cur} A', geo, [cur]*6)
        show(f'way 3 alone at {cur} A', geo, [0, 0, cur, 0, 0, 0])
        show(f'way 1 alone at {cur} A', geo, [cur, 0, 0, 0, 0, 0])
    show('six at 30 A, pessimistic', geo, [30]*6, Rcu20=1.0, **PESS)
    show('six at 20 A, pessimistic', geo, [20]*6, Rcu20=1.0, **PESS)
    show('way 3 alone 30 A, pessimistic', geo, [0, 0, 30, 0, 0, 0], Rcu20=1.0, **PESS)
    show('six at 30 A, optimistic', geo, [30]*6, Rcu20=0.5, **OPT)
show('28.0, six at 30 A, 2 oz', strip(depth=28.0, nut_y=14, slots=False, module=False, oz=2), [30]*6, Rcu20=0.375)

print('#### Yoke: ways listed from the chin, the module arm first, then the other arm')
geo = yoke()
print(f'board share per way {geo["share"]:.0f} mm2')
for rcu, pr, orr in [(0.90, 1.2, 0.6), (0.75, 1.0, 0.5)]:
    print(f'== yoke, copper {rcu} mOhm a way')
    for cur in (30, 20):
        show(f'six at {cur} A, one arm', geo, [cur]*6 + z, Rcu20=rcu)
        show(f'way 3 alone at {cur} A', geo, [0, 0, cur, 0, 0, 0] + z, Rcu20=rcu)
        show(f'nearest way alone at {cur} A', geo, [cur, 0, 0, 0, 0, 0] + z, Rcu20=rcu)
    show('twelve at 30 A (360 A)', geo, [30]*12, Rcu20=rcu)
    show('3 x 30 + 10 A nearest the chin', geo, [30, 30, 30, 10, 0, 0] + z, Rcu20=rcu)
    show('100 A over twelve ways', geo, [100/12]*12, Rcu20=rcu)
    show('100 A over one arm', geo, [100/6]*6 + z, Rcu20=rcu)
    show('idle, module only', geo, z + z, Rcu20=rcu)
    show('six at 30 A, pessimistic', geo, [30]*6 + z, Rcu20=pr, **PESS)
    show('twelve at 30 A, pessimistic', geo, [30]*12, Rcu20=pr, **PESS)
    show('six at 20 A, pessimistic', geo, [20]*6 + z, Rcu20=pr, **PESS)
    show('twelve at 20 A, pessimistic', geo, [20]*12, Rcu20=pr, **PESS)
    show('way 3 alone 30 A, pessimistic', geo, [0, 0, 30, 0, 0, 0] + z, Rcu20=pr, **PESS)
    show('six at 30 A, optimistic', geo, [30]*6 + z, Rcu20=orr, **OPT)
print('== yoke variants, copper 0.90 mOhm')
show('six at 30 A, 2 oz', yoke(oz=2), [30]*6 + z, Rcu20=0.45)
show('way 3 alone at 30 A, 2 oz', yoke(oz=2), [0, 0, 30, 0, 0, 0] + z, Rcu20=0.45)
show('six at 30 A, 2 oz, pessimistic', yoke(oz=2), [30]*6 + z, Rcu20=0.6, **PESS)
show('six at 30 A, channel half copper', yoke(lane_oz=0.5), [30]*6 + z, Rcu20=0.90)
show('six at 30 A, module 10 nearer', yoke(module_shift=10), [30]*6 + z, Rcu20=0.90)
print('== yoke, copper 0.90 mOhm, module unpowered: what the load alone puts on the chin')
show('six at 30 A', geo, [30]*6 + z, Rcu20=0.90, Pmod=0)
show('six at 30 A, pessimistic', geo, [30]*6 + z, Rcu20=1.2, Pmod=0, **PESS)
show('twelve at 30 A, pessimistic', geo, [30]*12, Rcu20=1.2, Pmod=0, **PESS)
show('six at 20 A, pessimistic', geo, [20]*6 + z, Rcu20=1.2, Pmod=0, **PESS)
print('== yoke, pessimistic, module powered')
show('idle', geo, z + z, Rcu20=1.2, **PESS)
show('3 x 30 + 10 A nearest the chin', geo, [30, 30, 30, 10, 0, 0] + z, Rcu20=1.2, **PESS)
