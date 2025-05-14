import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token, get_jwt
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
from PIL import Image

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-12345'  # Thay bằng key bảo mật mạnh hơn
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # Token hết hạn sau 1 giờ
CORS(app)
jwt = JWTManager(app)

# Khởi tạo AWS services
try:
    rekognition = boto3.client('rekognition', region_name='us-east-1')
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    s3 = boto3.client('s3', region_name='us-east-1')
    print("Successfully connected to AWS services")
except Exception as e:
    print(f"Error connecting to AWS: {str(e)}")
    raise

# Định nghĩa các bảng DynamoDB
users_table = dynamodb.Table('Users')
students_table = dynamodb.Table('Students')
attendance_table = dynamodb.Table('AttendanceHistory')

# Khởi tạo bảng DynamoDB
# def init_dynamodb():
#     tables = [
#         {
#             'TableName': 'Users',
#             'KeySchema': [{'AttributeName': 'student_id', 'KeyType': 'HASH'}],
#             'AttributeDefinitions': [{'AttributeName': 'student_id', 'AttributeType': 'S'}]
#         },
#         {
#             'TableName': 'Students',
#             'KeySchema': [{'AttributeName': 'student_id', 'KeyType': 'HASH'}],
#             'AttributeDefinitions': [{'AttributeName': 'student_id', 'AttributeType': 'S'}]
#         },
#         {
#             'TableName': 'AttendanceHistory',
#             'KeySchema': [
#                 {'AttributeName': 'student_id', 'KeyType': 'HASH'},
#                 {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
#             ],
#             'AttributeDefinitions': [
#                 {'AttributeName': 'student_id', 'AttributeType': 'S'},
#                 {'AttributeName': 'timestamp', 'AttributeType': 'S'}
#             ]
#         }
#     ]

#     for table_config in tables:
#         try:
#             dynamodb.create_table(
#                 TableName=table_config['TableName'],
#                 KeySchema=table_config['KeySchema'],
#                 AttributeDefinitions=table_config['AttributeDefinitions'],
#                 BillingMode='PAY_PER_REQUEST'
#             )
#             dynamodb.Table(table_config['TableName']).wait_until_exists()
#             print(f"Created {table_config['TableName']} table")
#         except ClientError as e:
#             if e.response['Error']['Code'] == 'ResourceInUseException':
#                 print(f"{table_config['TableName']} table already exists")
#             else:
#                 raise

# init_dynamodb()

# Định nghĩa collection_id và bucket_name
collection_id = 'face-attendance-collection'
bucket_name = 'rekognition-custom-projects-us-east-1-4324c2e986'

@app.route('/')
def index():
    return jsonify({'message': 'Chào mừng đến với Face Attendance API!'}), 200

@app.route('/student/login', methods=['POST'])
def student_login():
    data = request.get_json()
    student_id = data.get('student_id')
    password = data.get('password')

    try:
        response = users_table.get_item(Key={'student_id': student_id})
        user = response.get('Item')

        if not user:
            return jsonify({'error': 'Không tìm thấy sinh viên'}), 404
        if user.get('password') != password:
            return jsonify({'error': 'Sai mật khẩu'}), 401
        if user.get('role') != 'student':
            return jsonify({'error': 'Bạn không phải là sinh viên'}), 403

        access_token = create_access_token(identity=student_id, additional_claims={"role": "student"})
        print(f"Generated token for student {student_id}: {access_token}")
        return jsonify({
            'message': 'Đăng nhập thành công',
            'access_token': access_token,
            'student_id': student_id,
            'role': 'student'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    teacher_id = data.get('student_id')  # Sử dụng teacher_id thay vì student_id
    password = data.get('password')

    try:
        response = users_table.get_item(Key={'student_id': teacher_id})
        user = response.get('Item')

        if not user:
            return jsonify({'error': 'Không tìm thấy người dùng'}), 404
        if user.get('password') != password:
            return jsonify({'error': 'Sai mật khẩu'}), 401
        if user.get('role') != 'teacher':
            return jsonify({'error': 'Bạn không có quyền đăng nhập vào admin panel'}), 403

        access_token = create_access_token(identity=teacher_id, additional_claims={"role": "teacher"})
        print(f"Generated token for teacher {teacher_id}: {access_token}")
        return jsonify({
            'message': 'Đăng nhập thành công',
            'access_token': access_token,
            'student_id': teacher_id,
            'role': 'teacher'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    if 'image' not in request.files:
        return jsonify({'error': 'Thiếu ảnh. Vui lòng tải ảnh khuôn mặt.'}), 400

    image = request.files['image']
    student_id = request.form.get('student_id')
    name = request.form.get('name', '')
    class_id = request.form.get('class_id', '')

    if not student_id:
        return jsonify({'error': 'Mã sinh viên là bắt buộc.'}), 400

    try:
        image_bytes = image.read()
        if not image_bytes:
            return jsonify({'error': 'Ảnh rỗng. Vui lòng thử lại.'}), 400

        img = Image.open(io.BytesIO(image_bytes))
        image_format = img.format.lower()
        if image_format not in ['jpeg', 'png']:
            return jsonify({'error': f'Định dạng ảnh không hợp lệ: {image_format}. Chỉ hỗ trợ JPEG hoặc PNG.'}), 400

        s3_key = f"students/{student_id}/{image.filename}"
        s3.put_object(Bucket=bucket_name, Key=s3_key, Body=image_bytes)
        image_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"

        response = rekognition.index_faces(
            CollectionId=collection_id,
            Image={'Bytes': image_bytes},
            ExternalImageId=student_id,
            DetectionAttributes=['ALL']
        )

        if not response['FaceRecords']:
            return jsonify({'error': 'Không tìm thấy khuôn mặt trong ảnh. Vui lòng thử lại.'}), 400

        password = student_id

        users_table.put_item(
            Item={
                'student_id': student_id,
                'password': password,
                'role': 'student',
                'name': name,
                'class_id': class_id
            }
        )

        students_table.put_item(
            Item={
                'student_id': student_id,
                'name': name,
                'class_id': class_id,
                'image_url': image_url
            }
        )

        return jsonify({
            'message': f'Đăng ký thành công cho sinh viên: {student_id}',
            'password': password,
            'image_url': image_url
        })
    except Exception as e:
        print(f"Error in /register: {str(e)}")
        return jsonify({'error': f'Lỗi đăng ký: {str(e)}'}), 500

@app.route('/register-teacher', methods=['POST'])
def register_teacher():
    if 'image' not in request.files:
        return jsonify({'error': 'Thiếu ảnh. Vui lòng tải ảnh khuôn mặt.'}), 400

    image = request.files['image']
    teacher_id = request.form.get('teacher_id')
    name = request.form.get('name', '')
    degree = request.form.get('degree', '')  # Bằng cấp
    position = request.form.get('position', '')  # Chức vụ (có thể trống)
    faculty = request.form.get('faculty', '')  # Khoa (thay cho department)

    if not teacher_id:
        return jsonify({'error': 'Mã giáo viên là bắt buộc.'}), 400
    if not degree:
        return jsonify({'error': 'Bằng cấp là bắt buộc.'}), 400
    if not faculty:
        return jsonify({'error': 'Khoa là bắt buộc.'}), 400

    try:
        # Kiểm tra xem teacher_id đã tồn tại chưa
        response = users_table.get_item(Key={'student_id': teacher_id})
        if 'Item' in response:
            return jsonify({'error': 'Mã giáo viên đã tồn tại.'}), 400

        image_bytes = image.read()
        if not image_bytes:
            return jsonify({'error': 'Ảnh rỗng. Vui lòng thử lại.'}), 400

        img = Image.open(io.BytesIO(image_bytes))
        image_format = img.format.lower()
        if image_format not in ['jpeg', 'png']:
            return jsonify({'error': f'Định dạng ảnh không hợp lệ: {image_format}. Chỉ hỗ trợ JPEG hoặc PNG.'}), 400

        s3_key = f"teachers/{teacher_id}/{image.filename}"
        s3.put_object(Bucket=bucket_name, Key=s3_key, Body=image_bytes)
        image_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"

        response = rekognition.index_faces(
            CollectionId=collection_id,
            Image={'Bytes': image_bytes},
            ExternalImageId=teacher_id,
            DetectionAttributes=['ALL']
        )

        if not response['FaceRecords']:
            return jsonify({'error': 'Không tìm thấy khuôn mặt trong ảnh. Vui lòng thử lại.'}), 400

        password = teacher_id

        users_table.put_item(
            Item={
                'student_id': teacher_id,
                'password': password,
                'role': 'teacher',
                'name': name,
                'degree': degree,  # Lưu bằng cấp
                'position': position,  # Lưu chức vụ (có thể trống)
                'faculty': faculty  # Lưu khoa (thay cho department)
            }
        )

        return jsonify({
            'message': f'Đăng ký thành công cho giáo viên: {teacher_id}',
            'password': password,
            'image_url': image_url
        })
    except Exception as e:
        print(f"Error in /register-teacher: {str(e)}")
        return jsonify({'error': f'Lỗi đăng ký: {str(e)}'}), 500

@app.route('/attendance', methods=['POST'])
@jwt_required()
def attendance():
    logged_in_student_id = get_jwt_identity()
    if 'image' not in request.files:
        print("No image file in request")
        return jsonify({'error': 'Thiếu ảnh'}), 400
    image = request.files['image']
    image_bytes = image.read()
    if not image_bytes:
        print("Image is empty")
        return jsonify({'error': 'Ảnh rỗng'}), 400
    try:
        detect_response = rekognition.detect_faces(
            Image={'Bytes': image_bytes}
        )
        if len(detect_response['FaceDetails']) == 0:
            return jsonify({'error': 'Không tìm thấy khuôn mặt trong ảnh!'}), 400
        if len(detect_response['FaceDetails']) > 1:
            return jsonify({'error': 'Ảnh chứa nhiều hơn 1 khuôn mặt!'}), 400

        response = rekognition.search_faces_by_image(
            CollectionId='face-attendance-collection',
            Image={'Bytes': image_bytes},
            MaxFaces=1,
            FaceMatchThreshold=95
        )
        if response['FaceMatches']:
            matched_student_id = response['FaceMatches'][0]['Face']['ExternalImageId']
            if matched_student_id != logged_in_student_id:
                return jsonify({'error': 'Khuôn mặt không khớp với tài khoản đăng nhập'}), 403

            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            attendance_table.put_item(
                Item={
                    'student_id': matched_student_id,
                    'timestamp': timestamp,
                    'status': 'Có mặt'
                }
            )

            student_response = students_table.get_item(Key={'student_id': matched_student_id})
            if 'Item' not in student_response:
                return jsonify({'error': 'Không tìm thấy thông tin sinh viên'}), 404
            student = student_response.get('Item', {})

            return jsonify({
                'message': 'Điểm danh thành công',
                'student_id': matched_student_id,
                'student_name': student.get('name', 'Không xác định'),
                'class_id': student.get('class_id', 'Không xác định'),
                'timestamp': timestamp,
                'status': 'Có mặt'
            })
        else:
            print("No face matches found")
            return jsonify({'error': 'Không nhận diện được khuôn mặt'}), 404
    except Exception as e:
        print(f"Error in /attendance: {str(e)}")
        return jsonify({'error': f'Lỗi Rekognition: {str(e)}'}), 500

@app.route('/attendance-history', methods=['GET'])
@jwt_required()
def get_attendance_history():
    logged_in_user_id = get_jwt_identity()  # Lấy ID người dùng từ token
    claims = get_jwt()  # Lấy claims từ token
    user_role = claims.get('role')  # Lấy vai trò từ token

    print(f"Logged in user: {logged_in_user_id}, Role: {user_role}")  # Log để debug

    try:
        history_with_details = []
        if user_role == 'teacher':
            # Giáo viên: Lấy tất cả bản ghi điểm danh
            response = attendance_table.scan()
            attendance_items = response.get('Items', [])
        else:
            # Sinh viên: Chỉ lấy bản ghi của chính họ
            response = attendance_table.scan(
                FilterExpression='student_id = :sid',
                ExpressionAttributeValues={':sid': logged_in_user_id}
            )
            attendance_items = response.get('Items', [])

        # Lấy thông tin chi tiết của sinh viên từ bảng Students
        for item in attendance_items:
            student_response = students_table.get_item(Key={'student_id': item['student_id']})
            student = student_response.get('Item', {})
            history_with_details.append({
                'student_id': item['student_id'],
                'name': student.get('name', 'Không xác định'),
                'class_id': student.get('class_id', 'Không xác định'),
                'timestamp': item.get('timestamp', ''),
                'status': item.get('status', 'Không xác định')
            })

        return jsonify({'history': history_with_details})
    except Exception as e:
        print(f"Error in /attendance-history: {str(e)}")
        return jsonify({'error': f'Lỗi khi lấy lịch sử điểm danh: {str(e)}'}), 500
    
@app.route('/update-attendance-status', methods=['POST'])
@jwt_required()
def update_attendance_status():
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')

        if role != 'teacher':
            return jsonify({'error': 'Bạn không có quyền chỉnh sửa trạng thái'}), 403

        data = request.get_json()
        student_id = data.get('student_id')
        timestamp = data.get('timestamp')
        new_status = data.get('status')

        if not student_id or not timestamp or not new_status:
            return jsonify({'error': 'Thiếu thông tin: student_id, timestamp, hoặc status'}), 400

        if new_status not in ['Có mặt', 'Vắng mặt']:
            return jsonify({'error': 'Trạng thái không hợp lệ'}), 400

        response = attendance_table.update_item(
            Key={
                'student_id': student_id,
                'timestamp': timestamp
            },
            UpdateExpression='SET #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': new_status},
            ReturnValues='UPDATED_NEW'
        )
        return jsonify({
            'message': f'Cập nhật trạng thái thành công cho {student_id} tại {timestamp}',
            'updated_status': response['Attributes']['status']
        })
    except ClientError as e:
        return jsonify({'error': f'Lỗi DynamoDB: {str(e)}'}), 500

@app.route('/students', methods=['GET'])
@jwt_required()
def get_students():
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')

    if role != 'teacher':
        return jsonify({'error': 'Chỉ giáo viên được phép xem danh sách sinh viên'}), 403
    try:
        response = students_table.scan()
        students = response.get('Items', [])
        return jsonify(students)
    except Exception as e:
        print(f"Error in /students: {str(e)}")
        return jsonify({'error': f'Lỗi DynamoDB: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)