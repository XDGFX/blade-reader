// SPDX-License-Identifier: AGPL-3.0-or-later
#include <string>

#include "doctest.h"

#include "core_password.h"

using namespace blade_core;

TEST_CASE("a password is 8 to 64 characters") {
  CHECK(check_password("") == PASSWORD_TOO_SHORT);
  CHECK(check_password("1234567") == PASSWORD_TOO_SHORT);
  CHECK(check_password("12345678") == PASSWORD_OK);
  CHECK(check_password(std::string(64, 'a')) == PASSWORD_OK);
  CHECK(check_password(std::string(65, 'a')) == PASSWORD_TOO_LONG);
}

TEST_CASE("a password is printable ASCII, spaces and symbols included") {
  CHECK(check_password("correct horse ~!@#$%^&*()") == PASSWORD_OK);
  CHECK(check_password("tab\there!") == PASSWORD_BAD_CHARACTER);
  CHECK(check_password("caf\xC3\xA9 au lait") == PASSWORD_BAD_CHARACTER);
  CHECK(check_password(std::string("nul\0inside", 10)) == PASSWORD_BAD_CHARACTER);
  CHECK(check_password("delete\x7F!") == PASSWORD_BAD_CHARACTER);
}

TEST_CASE("every problem has words for the page") {
  for (auto p : {PASSWORD_TOO_SHORT, PASSWORD_TOO_LONG, PASSWORD_BAD_CHARACTER})
    CHECK(std::string(password_problem_text(p)).size() > 10);
}
