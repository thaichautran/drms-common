using System.ComponentModel.DataAnnotations;

namespace OpenGIS.Module.Core.ViewModels
{
    public class UserAPIViewModel
    {
    }

    public class UserRegisterViewModel
    {
        [Required(ErrorMessage = "Họ tên không được để trống")]
        public string UserName { get; set; }

        [Required(ErrorMessage = "Email không được để trống")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        public string Phone { get; set; }

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        public string Password { get; set; }
    }
}
