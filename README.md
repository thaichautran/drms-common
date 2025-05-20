# 🌐 Ứng dụng DRMS - Disaster Response Management System

**Ứng dụng cơ sở dữ liệu và hệ thống thông tin địa lý để xây dựng kịch bản phòng chống thiên tai.**

---

## 🚀 Hướng dẫn cài đặt

### 🛠️ Công nghệ sử dụng

- **PostgreSQL** – Hệ quản trị cơ sở dữ liệu
- **ASP.NET** – Framework hỗ trợ xây dựng API
- **Flutter** – Framework xây dựng ứng dụng di động
- **VietGIS.Infrastructure** – Thư viện hệ thống GIS nội bộ dựa trên ASP.NET của [Công ty TNHH VietGIS](https://vietgis.com.vn/)

> ⚠️ **Lưu ý:** ASP.NET và Flutter chỉ dùng để trực quan hóa dữ liệu trên bản đồ số. **Toàn bộ thao tác chính của hệ thống được thực hiện trong PostgreSQL.** Vì vậy phần hướng dẫn bên dưới sẽ tập trung vào cài đặt và thao tác với PostgreSQL.

---

## 📋 Các bước cài đặt

### 🔹 Bước 1: Cài đặt PostgreSQL

Tải về từ trang chính thức:  
👉 https://www.postgresql.org/download/

---

### 🔹 Bước 2: Cài đặt phần mềm hỗ trợ DBeaver

DBeaver cung cấp giao diện trực quan để quản lý cơ sở dữ liệu.  
👉 Tải tại: https://dbeaver.io/download/

---

### 🔹 Bước 3: Kết nối với PostgreSQL

- Mở DBeaver
- Chuột phải vào **sidebar bên trái** → `Create` → `Connection` → chọn **PostgreSQL**

![Kết nối PostgreSQL](https://github.com/user-attachments/assets/151dea1b-07bd-4f62-ba1c-606c828db8ba)

---

### 🔹 Bước 4: Nhập thông tin kết nối

- **Username** & **Password**: Nhập thông tin đã tạo khi cài PostgreSQL  
- **Database**: postgres  
- Nhấn `Finish`

![Nhập thông tin kết nối](https://github.com/user-attachments/assets/aec0f53e-7f86-4b9a-8d1a-bde37219955e)

---

### 🔹 Bước 5: Tạo database và import dữ liệu

- Chuột phải vào connection → `Create database`
- Tiếp theo chọn **Tools** → **Execute Script**

![Tạo database](https://github.com/user-attachments/assets/f48121ef-ed44-4027-a1f2-32b31c9edbdb)

---

### 🔹 Bước 6: Import dữ liệu từ tệp backup

- Chọn file backup `dump-KLTN-202505200459.sql`
- Nhấn `Start` để bắt đầu import dữ liệu

![Import dữ liệu](https://github.com/user-attachments/assets/1d376f54-9dc7-4928-9883-642ab30d0eb8)

---

### 🔹 Bước 7: Mở giao diện SQL Editor

- Chuột phải vào database vừa import → chọn **SQL Editor** → **Open SQL Script**

![SQL Editor](https://github.com/user-attachments/assets/d7a9654a-66de-45b2-9bbe-3be53182ccab)

---

### 🔹 Bước 8: Chạy truy vấn kiểm tra

Thử truy vấn để tìm đường đi an toàn giữa hai điểm:

```sql
SELECT * FROM wrk_fromatob_safe(
    15.831428880692721, 108.32606507203573,  
    15.595592001094285, 108.45862729258717,
    false
);


## 🚀 Video demo trực quan hóa trên thiết bị di động

https://youtube.com/shorts/8OUUbp7DVdA?feature=share

