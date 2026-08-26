package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.annotation.NonNull;
import androidx.room.PrimaryKey;

@Entity(tableName = "evacuations")
public class EvacuationEntity {
    @PrimaryKey
        @NonNull public String id;
    public String villageName;
    public String shelterName;
    public int evacuees;
    public int routeDurationSec;
    public String status; // pending, in_transit, completed
    public int busesNeeded;
    public int boatsNeeded;
    public String createdAt;
    public String updatedAt;
}