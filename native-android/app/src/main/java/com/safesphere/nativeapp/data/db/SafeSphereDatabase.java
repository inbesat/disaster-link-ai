package com.safesphere.nativeapp.data.db;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.TypeConverters;

import com.safesphere.nativeapp.data.dao.AlertDao;
import com.safesphere.nativeapp.data.dao.AuditLogDao;
import com.safesphere.nativeapp.data.dao.DistrictConfigDao;
import com.safesphere.nativeapp.data.dao.EvacuationDao;
import com.safesphere.nativeapp.data.dao.FamilyMemberDao;
import com.safesphere.nativeapp.data.dao.InventoryMovementDao;
import com.safesphere.nativeapp.data.dao.KnowledgeDocDao;
import com.safesphere.nativeapp.data.dao.ResourceDao;
import com.safesphere.nativeapp.data.dao.RoadClosureDao;
import com.safesphere.nativeapp.data.dao.ShelterDao;
import com.safesphere.nativeapp.data.dao.SosEventDao;
import com.safesphere.nativeapp.data.dao.UserDao;
import com.safesphere.nativeapp.data.entity.AlertEntity;
import com.safesphere.nativeapp.data.entity.AuditLogEntity;
import com.safesphere.nativeapp.data.entity.DistrictConfigEntity;
import com.safesphere.nativeapp.data.entity.EvacuationEntity;
import com.safesphere.nativeapp.data.entity.FamilyMemberEntity;
import com.safesphere.nativeapp.data.entity.InventoryMovementEntity;
import com.safesphere.nativeapp.data.entity.KnowledgeDocEntity;
import com.safesphere.nativeapp.data.entity.ResourceEntity;
import com.safesphere.nativeapp.data.entity.RoadClosureEntity;
import com.safesphere.nativeapp.data.entity.ShelterEntity;
import com.safesphere.nativeapp.data.entity.SosEventEntity;
import com.safesphere.nativeapp.data.entity.UserEntity;

@Database(
    entities = {
        UserEntity.class,
        AlertEntity.class,
        ShelterEntity.class,
        ResourceEntity.class,
        EvacuationEntity.class,
        ReportEntity.class,
        RoadClosureEntity.class,
        AuditLogEntity.class,
        FamilyMemberEntity.class,
        SosEventEntity.class,
        KnowledgeDocEntity.class,
        InventoryMovementEntity.class,
        DistrictConfigEntity.class
    },
    version = 1,
    exportSchema = true
)
@TypeConverters({Converters.class})
public abstract class SafeSphereDatabase extends RoomDatabase {

    private static volatile SafeSphereDatabase INSTANCE;

    public abstract UserDao userDao();
    public abstract AlertDao alertDao();
    public abstract ShelterDao shelterDao();
    public abstract ResourceDao resourceDao();
    public abstract EvacuationDao evacuationDao();
    public abstract ReportDao reportDao();
    public abstract RoadClosureDao roadClosureDao();
    public abstract AuditLogDao auditLogDao();
    public abstract FamilyMemberDao familyMemberDao();
    public abstract SosEventDao sosEventDao();
    public abstract KnowledgeDocDao knowledgeDocDao();
    public abstract InventoryMovementDao inventoryMovementDao();
    public abstract DistrictConfigDao districtConfigDao();

    public static SafeSphereDatabase getInstance(Context context) {
        if (INSTANCE == null) {
            synchronized (SafeSphereDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(
                            context.getApplicationContext(),
                            SafeSphereDatabase.class,
                            "safesphere_db"
                        )
                        .fallbackToDestructiveMigration()
                        .build();
                }
            }
        }
        return INSTANCE;
    }

    public static void destroyInstance() {
        INSTANCE = null;
    }
}