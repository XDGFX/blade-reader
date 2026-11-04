# Firmware

`blade-reader.yaml` is the yoke's ESPHome configuration. It holds the board, and the
`blade_reader` component in `components/` does the rest. It does three jobs:

- **Updates over Wi-Fi.** After the first flash over USB-C, every update goes over Wi-Fi,
  encrypted with the API key in `secrets.yaml`. Safe mode means a bad update can also be undone
  over Wi-Fi.
- **Its own page.** `http://blade-reader-a.local`, behind the web login in `secrets.yaml`,
  shows the fuse panel live, guides install mode and shows the fault text, with or without Home
  Assistant. It is in `web/`; open `web/try.html` in a browser to try it without a yoke.
  `esphome logs` shows the readings in a terminal.
- **Ready for Home Assistant.** When Home Assistant is set up it discovers the board, and you
  give it the same API key. Nothing on the board changes.

Each way zeros itself once it has been dead for 15 s and keeps the zero in flash; until then it
reads against a nominal 1.65 V zero, a few tenths of an amp off at no load. Gain is the CC6905's
nominal 44 mV/A times each way's gain trim, which starts at 1.0 and is set with the
`set_gain_trim` API action. Each way counts its energy in Wh, written to flash every 5 minutes and
before a restart or update. The full firmware also tracks the zero with temperature and raises
faults.
It's specified in [`docs/reference/firmware.md`](../docs/reference/firmware.md) and is built by
the tickets under [Spec: Blade Reader firmware](https://github.com/XDGFX/blade-reader/issues/117).
It arrives as an update over Wi-Fi.

The component's calculations are a hardware-free core with tests that run on a Mac:
`make -C firmware test` from the repo root.

## First flash from a Mac

### 1. Install ESPHome

```sh
brew install uv
uv tool install --python 3.13 esphome
uv tool update-shell     # then open a new Terminal window
esphome version
```

Not `brew install esphome`: Homebrew's runs on Python 3.15, which ESPHome doesn't support yet,
and the first build fails installing ESP-IDF's Python dependencies.

No USB driver is needed: the ESP32-C3's own USB shows up as `/dev/cu.usbmodem…`.

### 2. Set up the secrets

```sh
git clone https://github.com/XDGFX/blade-reader.git
cd blade-reader/firmware
cp secrets.example.yaml secrets.yaml
openssl rand -base64 32     # paste the result in as api_key
```

Fill in the Wi-Fi details in `secrets.yaml`, a web login for the board's page, and a fallback
password of eight characters or more.
**Keep a copy of `secrets.yaml` in your password manager.** Without the API key you can't update
the board over Wi-Fi, and you'd be back to the USB port. Git ignores the file.

Use a 2.4 GHz network: the ESP32-C3 has no 5 GHz radio.

### 3. Connect

- **Fit the board's ground wire first** if the board is on the panel. Without it, the USB cable
  becomes the board's ground.
- **Run the Mac on battery,** with its charger unplugged, if your system has shore power or an
  inverter. That keeps the Mac's charger out of the system's ground.
- Plug a USB-C data cable into the socket on the chin. On a live panel the board already runs
  from the panel; off the panel the USB powers it. Neither feeds the other.

```sh
ls /dev/cu.usbmodem*
```

One device should appear. If none does, try another cable: many USB-C cables carry power only.

### 4. Flash

```sh
esphome run blade-reader.yaml --device /dev/cu.usbmodemXXXX
```

The first build takes several minutes while it downloads the toolchain. ESPHome then flashes
the board, which needs no buttons: the ESP32-C3 resets itself into its bootloader over USB. When
it restarts, the logs follow. Look for a Wi-Fi connection and an IP address, then readings from
each way. The green LED blinks while the board has a problem, such as no Wi-Fi, and stays off
once it is connected.

If esptool can't connect, the recovery route is J1 with an ESP-PROG. J1's TXD and RXD are
crossed (see `docs/design.md`), so swap those two leads.

### 5. Test it, and prove the Wi-Fi update before giving up the USB port

1. Open `http://blade-reader-a.local` and log in with the web login. The panel voltage should be
   the battery's, each way with a fuse in should light, and a pulled fuse should go dead. Switch
   on a load you know, such as a light, and its way's current should move by about what you
   expect.
2. **Update over Wi-Fi once while the USB cable is still in reach:**

   ```sh
   esphome run blade-reader.yaml --device blade-reader-a.local
   ```

   macOS may ask whether Terminal can find devices on your local network: allow it (System
   Settings, Privacy & Security, Local Network). If `.local` doesn't resolve, use the IP from
   the logs.
3. Watch the logs over Wi-Fi:

   ```sh
   esphome logs blade-reader.yaml --device blade-reader-a.local
   ```

Once step 2 works, the USB port isn't needed again.

## More than one board

The name is a substitution, so the same file flashes every board:

```sh
esphome -s name blade-reader-b -s friendly_name "Blade Reader B" run blade-reader.yaml
```

Then use `blade-reader-b.local` for that board's updates, with the same `-s` options each time.

## Home Assistant, later

Home Assistant finds the board under Settings, Devices & services, ESPHome. Give it the API key
from `secrets.yaml`. For updates from Home Assistant's ESPHome add-on, copy `blade-reader.yaml`
and `secrets.yaml` into its config folder.
