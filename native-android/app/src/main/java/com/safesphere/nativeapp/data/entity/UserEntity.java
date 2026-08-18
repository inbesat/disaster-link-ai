package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "users")
public class UserEntity {
    @PrimaryKey
    public String id;
    public String email;
    public String name;
    public String phone;
    public String role; // super_admin, district_admin, field_responder, viewer, public
    public String organization;
    public String assignedDistrict;
    public String status; // active, inactive
    public String lastActive;
    public String avatarUrl;
    public String passwordHash; // for demo gov login
    public String createdAt;
    public String updatedAt;
    public boolean guestMode = false;
    public boolean pwdPriority = false;
    public String pwdDetails;
}