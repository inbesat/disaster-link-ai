package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "sos_events")
public class SosEventEntity {
    @PrimaryKey
    public String id;
    public String userId;
    public String type; // rescue, medical, location_share, helpline, safe
    public double lat;
    public double lng;
    public String message;
    public String status; // sent, cancelled, completed
    public String resolution;
    public String createdAt;
    public String resolvedAt;
}