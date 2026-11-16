// SPDX-License-Identifier: AGPL-3.0-or-later
#include "core_password.h"

namespace blade_core {

PasswordProblem check_password(const std::string &password) {
  if (password.size() < PASSWORD_MIN_LENGTH)
    return PASSWORD_TOO_SHORT;
  if (password.size() > PASSWORD_MAX_LENGTH)
    return PASSWORD_TOO_LONG;
  for (char c : password) {
    if (c < 0x20 || c > 0x7E)
      return PASSWORD_BAD_CHARACTER;
  }
  return PASSWORD_OK;
}

const char *password_problem_text(PasswordProblem problem) {
  switch (problem) {
    case PASSWORD_OK:
      return "OK";
    case PASSWORD_TOO_SHORT:
      return "Use 8 characters or more.";
    case PASSWORD_TOO_LONG:
      return "Use 64 characters or fewer.";
    case PASSWORD_BAD_CHARACTER:
      return "Use letters, digits, spaces and the symbols on a US keyboard only.";
  }
  return "Not a password.";
}

}  // namespace blade_core
