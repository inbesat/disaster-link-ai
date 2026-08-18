package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "resources")
public class ResourceEntity {
    @PrimaryKey
    public String id;
    public String name;
    public String category; // boat, food, medical, water, personnel, vehicle, communication, power, other
    public int quantity;
    public String unit;
    public String depotName;
    public double lat;
    public double lng;
    public String status; // available, deployed, maintenance
    public String createdAt;
    public String updatedAt;
}