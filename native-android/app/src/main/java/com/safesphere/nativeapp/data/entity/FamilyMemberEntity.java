package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "family_members")
public class FamilyMemberEntity {
    @PrimaryKey
    public String id;
    public String userId; // owner
    public String name;
    public String phone;
    public String relation;
    public double lat;
    public double lng;
    public String status; // safe, at_risk, unknown
    public String lastSeen;
    public String createdAt;
}