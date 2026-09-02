from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from accounts.models import User, Role
from .models import StaffProfile, LeaveRequest


class AvailableUserSerializer(serializers.ModelSerializer):
    """Approved users who don't yet have a staff profile - the pool shown
    when linking an existing account to a new staff record."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email']

    def get_full_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.username


class StaffAccountCreateSerializer(serializers.Serializer):
    """Onboards a brand-new employee: creates their login account AND
    their staff profile together, for the common case where they don't
    have an account yet. is_approved is set True directly since an admin
    is creating this deliberately - no separate self-registration approval
    step is needed here."""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), required=False, allow_null=True)
    department = serializers.ChoiceField(choices=StaffProfile.DEPARTMENT_CHOICES)
    position = serializers.CharField(max_length=100)
    date_hired = serializers.DateField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data['first_name'],
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data.get('role'),
            is_approved=True,
        )
        user.set_password(validated_data['password'])
        user.save()
        return StaffProfile.objects.create(
            user=user,
            department=validated_data['department'],
            position=validated_data['position'],
            date_hired=validated_data['date_hired'],
        )


class StaffProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = StaffProfile
        fields = ['id', 'user', 'username', 'full_name', 'department', 'position', 'date_hired', 'employment_status']

    def get_full_name(self, obj):
        full = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full or obj.user.username


class LeaveRequestSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = ['id', 'staff', 'staff_name', 'start_date', 'end_date', 'reason',
                  'status', 'reviewed_by_name', 'requested_at']
        read_only_fields = ['status', 'requested_at']

    def get_staff_name(self, obj):
        full = f"{obj.staff.user.first_name} {obj.staff.user.last_name}".strip()
        return full or obj.staff.user.username

    def get_reviewed_by_name(self, obj):
        if not obj.reviewed_by:
            return None
        full = f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip()
        return full or obj.reviewed_by.username

    def validate(self, attrs):
        if attrs['end_date'] < attrs['start_date']:
            raise serializers.ValidationError({'end_date': 'End date cannot be before start date.'})
        return attrs