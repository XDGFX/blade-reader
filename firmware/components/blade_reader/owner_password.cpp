// SPDX-License-Identifier: AGPL-3.0-or-later
#include "owner_password.h"

#ifdef USE_BLADE_READER_OWNER_PASSWORD

#include <cstring>

#include "esphome/core/log.h"

namespace esphome::blade_reader {

static const char *const TAG = "blade_reader.password";

// Beside the records' keys (blade_reader.cpp), outside any record kind. Changing it forgets every
// board's password.
static constexpr uint32_t OWNER_PASSWORD_KEY = 0xB1AD0F00;

struct StoredPassword {
  char text[blade_core::PASSWORD_MAX_LENGTH + 1];
};

static ESPPreferenceObject make_password_preference() {
  return global_preferences->make_preference(sizeof(StoredPassword), OWNER_PASSWORD_KEY, true);
}

// The stored password, or "" if there is none or it doesn't pass the rules.
static std::string load_stored(ESPPreferenceObject &pref) {
  StoredPassword stored{};
  if (!pref.load(&stored))
    return "";
  stored.text[blade_core::PASSWORD_MAX_LENGTH] = '\0';
  std::string password(stored.text);
  return blade_core::check_password(password) == blade_core::PASSWORD_OK ? password : "";
}

void apply_stored_password_to_ota(ESPHomeOTAComponent *ota) {
  ESPPreferenceObject pref = make_password_preference();
  std::string password = load_stored(pref);
  if (!password.empty())
    ota->set_auth_password(password);
}

void OwnerPassword::load() {
  this->pref_ = make_password_preference();
  std::string password = load_stored(this->pref_);
  if (!password.empty())
    this->apply_(password);
}

void OwnerPassword::apply_(const std::string &password) {
  uint8_t next = this->active_ ^ 1;
  std::memcpy(this->buffers_[next], password.c_str(), password.size() + 1);
  this->web_->set_auth_password(this->buffers_[next]);
  this->active_ = next;
  this->ota_->set_auth_password(password);
  this->set_ = true;
}

void OwnerPassword::store_(const std::string &password) {
  StoredPassword stored{};
  std::memcpy(stored.text, password.c_str(), password.size());
  // Applied even if the write fails, so the board is locked until it next boots.
  if (!this->pref_.save(&stored) || !global_preferences->sync())
    ESP_LOGW(TAG, "Couldn't write the password to flash");
  this->apply_(password);
  ESP_LOGI(TAG, "Password set: the page and OTA updates now ask for it");
}

bool OwnerPassword::canHandle(AsyncWebServerRequest *request) const {
  if (request->method() != HTTP_GET && request->method() != HTTP_POST)
    return false;
  char url_buf[AsyncWebServerRequest::URL_BUF_SIZE];
  return request->url_to(url_buf) == "/password";
}

// A page elsewhere could post to the yoke from the owner's browser; only the yoke's own page may.
// A request with no Origin isn't from a browser's cross-site form or fetch.
static bool same_origin(AsyncWebServerRequest *request) {
  auto origin = request->get_header("Origin");
  if (!origin.has_value())
    return true;
  auto host = request->get_header("Host");
  return host.has_value() && *origin == "http://" + *host;
}

void OwnerPassword::handleRequest(AsyncWebServerRequest *request) {
  if (request->method() == HTTP_GET) {
    request->send(200, "application/json", this->set_ ? "{\"set\":true}" : "{\"set\":false}");
    return;
  }
  if (!same_origin(request)) {
    request->send(403, "text/plain", "Set the password from the yoke's own page.");
    return;
  }
  auto *param = request->getParam("password");
  std::string password = param == nullptr ? "" : param->value();
  auto problem = blade_core::check_password(password);
  if (problem != blade_core::PASSWORD_OK) {
    request->send(400, "text/plain", blade_core::password_problem_text(problem));
    return;
  }
  // Flash and OTA belong to the main loop, not the web server's task.
  this->defer([this, password]() { this->store_(password); });
  request->send(200, "text/plain", "OK");
}

}  // namespace esphome::blade_reader

#endif  // USE_BLADE_READER_OWNER_PASSWORD
