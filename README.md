![image](https://github.com/user-attachments/assets/0865b950-84f4-4a14-beea-0058c6ea62a1)![image](https://github.com/user-attachments/assets/d64acfc0-1569-43c4-825e-7ac0f4943769)Ứng dụng cơ sở dữ liệu và hệ thống thông tin địa lý để xây dựng kịch bản phòng chống thiên tai (DRMS - Disaster Response Management System)
Hướng dẫn cài đặt
Công nghệ sử dụng:
- Hệ quản trị cơ sở dữ liệu PostgresSQL
- Framework ASP.NET hỗ trợ viết API
- Framework Flutter hỗ trợ xây dựng ứng dụng di dộng
- Thư viện cơ sở hạ tầng dựa trên ASP.NET nội bộ cho các hệ thống GIS - VietGIS.Infrastructure của công ty TNHH VietGIS (https://vietgis.com.vn/)

Trong đó, ASP.NET và Flutter chỉ dùng để trực quan hóa dữ liệu lên bản đồ số trên thiết bị di động còn toàn bộ thao tác dành cho bài toán được nêu trong khóa luận đều được thực hiện trên hệ quản trị cơ sở dữ liệu PostgreSQL nên phần này sẽ tập trung vào hướng dẫn cài đặt và thao tác trên PostgreSQL
Các bước:
Bước 1: Tải và cài đặt PostgreSQL: https://www.postgresql.org/download/
Bước 2: Tải và cài đặt phần mềm hỗ trợ quản trị cơ sở dữ liệu DBeaver để dễ tương tác nhờ có giao diện trực quan: https://dbeaver.io/download/
Bước 3: Sau khi cài đặt xong DBeaver, mở ứng dụng và chuột phải ở thanh sidebar phía bên trái màn hình rồi chọn create -> connection -> chọn postgreSQL
![image](https://github.com/user-attachments/assets/151dea1b-07bd-4f62-ba1c-606c828db8ba)
Bước 4: Nhập thông tin kết nối bằng username và password được tạo khi cài đặt postgreSQL, tên database là postgres rồi nhấn Finish
![image](https://github.com/user-attachments/assets/aec0f53e-7f86-4b9a-8d1a-bde37219955e)
Bước 5: Chuột phải vào connetion và tạo một database mới -> chọn Tools -> Chọn Excute Script
![image](https://github.com/user-attachments/assets/f48121ef-ed44-4027-a1f2-32b31c9edbdb)
Bước 6: Chọn tệp backup [Uploading dump-KLTN-202505200459.sql…]() và bấm Start rồi đợi cho dữ liệu được import toàn bộ
 ![image](https://github.com/user-attachments/assets/1d376f54-9dc7-4928-9883-642ab30d0eb8)
Bước 7: Chuột phải vào database vừa được import dữ liệu -> chọn SQL Editor -> chọn Open SQL Script
![image](https://github.com/user-attachments/assets/d7a9654a-66de-45b2-9bbe-3be53182ccab)
Bước 8: Chạy thử truy vấn để tìm đường đi giữa hai điểm như sau để xem kết quả

SELECT * FROM wrk_fromatob_safe(
15.831428880692721, 108.32606507203573,  
15.595592001094285, 108.45862729258717,
false);
