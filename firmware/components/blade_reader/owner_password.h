// SPDX-License-Identifier: AGPL-3.0-or-later
#pragma once

// The generic image's owner password: set from the yoke's own page, kept in flash, and asked for
// by the page's login and by OTA updates. Built only when the YAML gives blade_reader an
// owner_password (blade-reader-generic.yaml); docs/design.md (First flash) says why.

#include "esphome/core/defines.h"

#ifdef USE_BLADE_READER_OWNER_PASSWORD

#include <atomic>
#include <string>

#include "esphome/components/esphome/ota/ota_esphome.h"
#include "esphome/components/web_server_base/web_server_base.h"
#include "esphome/core/component.h"
#include "esphome/core/preferences.h"

#include "core_password.h"

namespace esphome::blade_reader {

// The page's login username, as in secrets.example.yaml.
static constexpr const char *OWNER_USERNAME = "admin";

// Serves /password: GET says whether one is set, POST password=… sets or changes it. Behind the
// login like every other handler once a password is set, so only the owner can change it.
class OwnerPassword : public Component, public AsyncWebHandler {
 public:
  OwnerPassword(ESPHomeOTAComponent *ota, web_server_base::WebServerBase *web) : ota_(ota), web_(web) {}

  // Applies the stored password, if any. Called before setup, so the login and OTA ask for it
  // from the moment they start.
  void load();

  bool canHandle(AsyncWebServerRequest *request) const override;
  void handleRequest(AsyncWebServerRequest *request) override;
  bool isRequestHandlerTrivial() const override { return false; }

 protected:
  void store_(const std::string &password);
  void apply_(const std::string &password);

  ESPHomeOTAComponent *ota_;
  web_server_base::WebServerBase *web_;
  ESPPreferenceObject pref_;
  // The web login reads the password by pointer from the server's task, so a new one goes into
  // the other buffer before the pointer moves to it.
  char buffers_[2][blade_core::PASSWORD_MAX_LENGTH + 1]{};
  uint8_t active_{0};
  std::atomic<bool> set_{false};
};

// In safe mode the component never starts, so safe_mode's on_safe_mode calls this to have OTA
// still ask for the stored password.
void apply_stored_password_to_ota(ESPHomeOTAComponent *ota);

}  // namespace esphome::blade_reader

#endif  // USE_BLADE_READER_OWNER_PASSWORD
