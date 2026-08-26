package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.annotation.NonNull;
import androidx.room.PrimaryKey;

@Entity(tableName = "road_closures")
public class RoadClosureEntity {
    @PrimaryKey
        @NonNull public String id;
    public double lat;
    public double lng;
    public String roadName;
    public String description;
    public boolean active;
    public String createdAt;
    public String updatedAt;
}