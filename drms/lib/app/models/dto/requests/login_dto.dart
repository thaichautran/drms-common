class LoginDTO {
  late String username;
  late String password;

  LoginDTO(this.username, this.password);

  LoginDTO.fromJson(dynamic data) {
    username = data['username'];
    password = data['password'];
  }

  toJson() => {
        "username": username,
        "password": password,
      };
  LoginDTO fromJson(Map<String, dynamic> json) {
    return LoginDTO.fromJson(json);
  }
}
