// SPDX-License-Identifier: AGPL-3.0-or-later
#pragma once

// The rules for the password an owner sets on the generic image's page. The page checks the same
// rules before it sends one (web/page.js, passwordProblem).

#include <string>

namespace blade_core {

// Long enough not to guess, short enough to type on a phone and to fit a basic-auth header.
constexpr size_t PASSWORD_MIN_LENGTH = 8;
constexpr size_t PASSWORD_MAX_LENGTH = 64;

enum PasswordProblem { PASSWORD_OK, PASSWORD_TOO_SHORT, PASSWORD_TOO_LONG, PASSWORD_BAD_CHARACTER };

// Printable ASCII only, space included, so a browser's login and ESPHome's OTA hash the same bytes.
PasswordProblem check_password(const std::string &password);

const char *password_problem_text(PasswordProblem problem);

}  // namespace blade_core
