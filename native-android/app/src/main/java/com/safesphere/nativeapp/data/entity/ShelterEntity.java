package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.annotation.NonNull;
import androidx.room.PrimaryKey;

@Entity(tableName = "shelters")
public class ShelterEntity {
    @PrimaryKey
        @NonNull public String id;
    public String name;
    public String district;
    public double lat;
    public double lng;
    public int capacity;
    public int currentOccupancy;
    public boolean water;
    public boolean food;
    public boolean medical;
    public boolean electricity;
    public String status; // open, full, closed
    public String contactPerson;
    public String phone;
    public String imageUrl;
    public String createdAt;
    public String updatedAt;
}