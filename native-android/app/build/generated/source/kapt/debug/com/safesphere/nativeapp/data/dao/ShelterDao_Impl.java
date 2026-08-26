package com.safesphere.nativeapp.data.dao;

import android.database.Cursor;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.safesphere.nativeapp.data.entity.ShelterEntity;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class ShelterDao_Impl implements ShelterDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<ShelterEntity> __insertionAdapterOfShelterEntity;

  private final EntityDeletionOrUpdateAdapter<ShelterEntity> __updateAdapterOfShelterEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public ShelterDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfShelterEntity = new EntityInsertionAdapter<ShelterEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `shelters` (`id`,`name`,`district`,`lat`,`lng`,`capacity`,`currentOccupancy`,`water`,`food`,`medical`,`electricity`,`status`,`contactPerson`,`phone`,`imageUrl`,`createdAt`,`updatedAt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final ShelterEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.name == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.name);
        }
        if (entity.district == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.district);
        }
        statement.bindDouble(4, entity.lat);
        statement.bindDouble(5, entity.lng);
        statement.bindLong(6, entity.capacity);
        statement.bindLong(7, entity.currentOccupancy);
        final int _tmp = entity.water ? 1 : 0;
        statement.bindLong(8, _tmp);
        final int _tmp_1 = entity.food ? 1 : 0;
        statement.bindLong(9, _tmp_1);
        final int _tmp_2 = entity.medical ? 1 : 0;
        statement.bindLong(10, _tmp_2);
        final int _tmp_3 = entity.electricity ? 1 : 0;
        statement.bindLong(11, _tmp_3);
        if (entity.status == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.status);
        }
        if (entity.contactPerson == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.contactPerson);
        }
        if (entity.phone == null) {
          statement.bindNull(14);
        } else {
          statement.bindString(14, entity.phone);
        }
        if (entity.imageUrl == null) {
          statement.bindNull(15);
        } else {
          statement.bindString(15, entity.imageUrl);
        }
        if (entity.createdAt == null) {
          statement.bindNull(16);
        } else {
          statement.bindString(16, entity.createdAt);
        }
        if (entity.updatedAt == null) {
          statement.bindNull(17);
        } else {
          statement.bindString(17, entity.updatedAt);
        }
      }
    };
    this.__updateAdapterOfShelterEntity = new EntityDeletionOrUpdateAdapter<ShelterEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `shelters` SET `id` = ?,`name` = ?,`district` = ?,`lat` = ?,`lng` = ?,`capacity` = ?,`currentOccupancy` = ?,`water` = ?,`food` = ?,`medical` = ?,`electricity` = ?,`status` = ?,`contactPerson` = ?,`phone` = ?,`imageUrl` = ?,`createdAt` = ?,`updatedAt` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final ShelterEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.name == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.name);
        }
        if (entity.district == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.district);
        }
        statement.bindDouble(4, entity.lat);
        statement.bindDouble(5, entity.lng);
        statement.bindLong(6, entity.capacity);
        statement.bindLong(7, entity.currentOccupancy);
        final int _tmp = entity.water ? 1 : 0;
        statement.bindLong(8, _tmp);
        final int _tmp_1 = entity.food ? 1 : 0;
        statement.bindLong(9, _tmp_1);
        final int _tmp_2 = entity.medical ? 1 : 0;
        statement.bindLong(10, _tmp_2);
        final int _tmp_3 = entity.electricity ? 1 : 0;
        statement.bindLong(11, _tmp_3);
        if (entity.status == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.status);
        }
        if (entity.contactPerson == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.contactPerson);
        }
        if (entity.phone == null) {
          statement.bindNull(14);
        } else {
          statement.bindString(14, entity.phone);
        }
        if (entity.imageUrl == null) {
          statement.bindNull(15);
        } else {
          statement.bindString(15, entity.imageUrl);
        }
        if (entity.createdAt == null) {
          statement.bindNull(16);
        } else {
          statement.bindString(16, entity.createdAt);
        }
        if (entity.updatedAt == null) {
          statement.bindNull(17);
        } else {
          statement.bindString(17, entity.updatedAt);
        }
        if (entity.id == null) {
          statement.bindNull(18);
        } else {
          statement.bindString(18, entity.id);
        }
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM shelters";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<ShelterEntity> shelters) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfShelterEntity.insert(shelters);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final ShelterEntity shelter) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfShelterEntity.insert(shelter);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final ShelterEntity shelter) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfShelterEntity.handle(shelter);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void deleteAll() {
    __db.assertNotSuspendingTransaction();
    final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAll.acquire();
    try {
      __db.beginTransaction();
      try {
        _stmt.executeUpdateDelete();
        __db.setTransactionSuccessful();
      } finally {
        __db.endTransaction();
      }
    } finally {
      __preparedStmtOfDeleteAll.release(_stmt);
    }
  }

  @Override
  public LiveData<ShelterEntity> getById(final String id) {
    final String _sql = "SELECT * FROM shelters WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (id == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, id);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"shelters"}, false, new Callable<ShelterEntity>() {
      @Override
      @Nullable
      public ShelterEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfCapacity = CursorUtil.getColumnIndexOrThrow(_cursor, "capacity");
          final int _cursorIndexOfCurrentOccupancy = CursorUtil.getColumnIndexOrThrow(_cursor, "currentOccupancy");
          final int _cursorIndexOfWater = CursorUtil.getColumnIndexOrThrow(_cursor, "water");
          final int _cursorIndexOfFood = CursorUtil.getColumnIndexOrThrow(_cursor, "food");
          final int _cursorIndexOfMedical = CursorUtil.getColumnIndexOrThrow(_cursor, "medical");
          final int _cursorIndexOfElectricity = CursorUtil.getColumnIndexOrThrow(_cursor, "electricity");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfContactPerson = CursorUtil.getColumnIndexOrThrow(_cursor, "contactPerson");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final ShelterEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new ShelterEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _result.id = null;
            } else {
              _result.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfName)) {
              _result.name = null;
            } else {
              _result.name = _cursor.getString(_cursorIndexOfName);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _result.district = null;
            } else {
              _result.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            _result.lat = _cursor.getDouble(_cursorIndexOfLat);
            _result.lng = _cursor.getDouble(_cursorIndexOfLng);
            _result.capacity = _cursor.getInt(_cursorIndexOfCapacity);
            _result.currentOccupancy = _cursor.getInt(_cursorIndexOfCurrentOccupancy);
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfWater);
            _result.water = _tmp != 0;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfFood);
            _result.food = _tmp_1 != 0;
            final int _tmp_2;
            _tmp_2 = _cursor.getInt(_cursorIndexOfMedical);
            _result.medical = _tmp_2 != 0;
            final int _tmp_3;
            _tmp_3 = _cursor.getInt(_cursorIndexOfElectricity);
            _result.electricity = _tmp_3 != 0;
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _result.status = null;
            } else {
              _result.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfContactPerson)) {
              _result.contactPerson = null;
            } else {
              _result.contactPerson = _cursor.getString(_cursorIndexOfContactPerson);
            }
            if (_cursor.isNull(_cursorIndexOfPhone)) {
              _result.phone = null;
            } else {
              _result.phone = _cursor.getString(_cursorIndexOfPhone);
            }
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _result.imageUrl = null;
            } else {
              _result.imageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _result.createdAt = null;
            } else {
              _result.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfUpdatedAt)) {
              _result.updatedAt = null;
            } else {
              _result.updatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            }
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public LiveData<List<ShelterEntity>> getByDistrict(final String district) {
    final String _sql = "SELECT * FROM shelters WHERE district = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (district == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, district);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"shelters"}, false, new Callable<List<ShelterEntity>>() {
      @Override
      @Nullable
      public List<ShelterEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfCapacity = CursorUtil.getColumnIndexOrThrow(_cursor, "capacity");
          final int _cursorIndexOfCurrentOccupancy = CursorUtil.getColumnIndexOrThrow(_cursor, "currentOccupancy");
          final int _cursorIndexOfWater = CursorUtil.getColumnIndexOrThrow(_cursor, "water");
          final int _cursorIndexOfFood = CursorUtil.getColumnIndexOrThrow(_cursor, "food");
          final int _cursorIndexOfMedical = CursorUtil.getColumnIndexOrThrow(_cursor, "medical");
          final int _cursorIndexOfElectricity = CursorUtil.getColumnIndexOrThrow(_cursor, "electricity");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfContactPerson = CursorUtil.getColumnIndexOrThrow(_cursor, "contactPerson");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<ShelterEntity> _result = new ArrayList<ShelterEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ShelterEntity _item;
            _item = new ShelterEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfName)) {
              _item.name = null;
            } else {
              _item.name = _cursor.getString(_cursorIndexOfName);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            _item.capacity = _cursor.getInt(_cursorIndexOfCapacity);
            _item.currentOccupancy = _cursor.getInt(_cursorIndexOfCurrentOccupancy);
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfWater);
            _item.water = _tmp != 0;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfFood);
            _item.food = _tmp_1 != 0;
            final int _tmp_2;
            _tmp_2 = _cursor.getInt(_cursorIndexOfMedical);
            _item.medical = _tmp_2 != 0;
            final int _tmp_3;
            _tmp_3 = _cursor.getInt(_cursorIndexOfElectricity);
            _item.electricity = _tmp_3 != 0;
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfContactPerson)) {
              _item.contactPerson = null;
            } else {
              _item.contactPerson = _cursor.getString(_cursorIndexOfContactPerson);
            }
            if (_cursor.isNull(_cursorIndexOfPhone)) {
              _item.phone = null;
            } else {
              _item.phone = _cursor.getString(_cursorIndexOfPhone);
            }
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _item.imageUrl = null;
            } else {
              _item.imageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfUpdatedAt)) {
              _item.updatedAt = null;
            } else {
              _item.updatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            }
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public LiveData<List<ShelterEntity>> getByStatus(final String status) {
    final String _sql = "SELECT * FROM shelters WHERE status = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (status == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, status);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"shelters"}, false, new Callable<List<ShelterEntity>>() {
      @Override
      @Nullable
      public List<ShelterEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfCapacity = CursorUtil.getColumnIndexOrThrow(_cursor, "capacity");
          final int _cursorIndexOfCurrentOccupancy = CursorUtil.getColumnIndexOrThrow(_cursor, "currentOccupancy");
          final int _cursorIndexOfWater = CursorUtil.getColumnIndexOrThrow(_cursor, "water");
          final int _cursorIndexOfFood = CursorUtil.getColumnIndexOrThrow(_cursor, "food");
          final int _cursorIndexOfMedical = CursorUtil.getColumnIndexOrThrow(_cursor, "medical");
          final int _cursorIndexOfElectricity = CursorUtil.getColumnIndexOrThrow(_cursor, "electricity");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfContactPerson = CursorUtil.getColumnIndexOrThrow(_cursor, "contactPerson");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<ShelterEntity> _result = new ArrayList<ShelterEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ShelterEntity _item;
            _item = new ShelterEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfName)) {
              _item.name = null;
            } else {
              _item.name = _cursor.getString(_cursorIndexOfName);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            _item.capacity = _cursor.getInt(_cursorIndexOfCapacity);
            _item.currentOccupancy = _cursor.getInt(_cursorIndexOfCurrentOccupancy);
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfWater);
            _item.water = _tmp != 0;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfFood);
            _item.food = _tmp_1 != 0;
            final int _tmp_2;
            _tmp_2 = _cursor.getInt(_cursorIndexOfMedical);
            _item.medical = _tmp_2 != 0;
            final int _tmp_3;
            _tmp_3 = _cursor.getInt(_cursorIndexOfElectricity);
            _item.electricity = _tmp_3 != 0;
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfContactPerson)) {
              _item.contactPerson = null;
            } else {
              _item.contactPerson = _cursor.getString(_cursorIndexOfContactPerson);
            }
            if (_cursor.isNull(_cursorIndexOfPhone)) {
              _item.phone = null;
            } else {
              _item.phone = _cursor.getString(_cursorIndexOfPhone);
            }
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _item.imageUrl = null;
            } else {
              _item.imageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfUpdatedAt)) {
              _item.updatedAt = null;
            } else {
              _item.updatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            }
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public LiveData<List<ShelterEntity>> getAll() {
    final String _sql = "SELECT * FROM shelters ORDER BY name ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"shelters"}, false, new Callable<List<ShelterEntity>>() {
      @Override
      @Nullable
      public List<ShelterEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfCapacity = CursorUtil.getColumnIndexOrThrow(_cursor, "capacity");
          final int _cursorIndexOfCurrentOccupancy = CursorUtil.getColumnIndexOrThrow(_cursor, "currentOccupancy");
          final int _cursorIndexOfWater = CursorUtil.getColumnIndexOrThrow(_cursor, "water");
          final int _cursorIndexOfFood = CursorUtil.getColumnIndexOrThrow(_cursor, "food");
          final int _cursorIndexOfMedical = CursorUtil.getColumnIndexOrThrow(_cursor, "medical");
          final int _cursorIndexOfElectricity = CursorUtil.getColumnIndexOrThrow(_cursor, "electricity");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfContactPerson = CursorUtil.getColumnIndexOrThrow(_cursor, "contactPerson");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<ShelterEntity> _result = new ArrayList<ShelterEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ShelterEntity _item;
            _item = new ShelterEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfName)) {
              _item.name = null;
            } else {
              _item.name = _cursor.getString(_cursorIndexOfName);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            _item.capacity = _cursor.getInt(_cursorIndexOfCapacity);
            _item.currentOccupancy = _cursor.getInt(_cursorIndexOfCurrentOccupancy);
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfWater);
            _item.water = _tmp != 0;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfFood);
            _item.food = _tmp_1 != 0;
            final int _tmp_2;
            _tmp_2 = _cursor.getInt(_cursorIndexOfMedical);
            _item.medical = _tmp_2 != 0;
            final int _tmp_3;
            _tmp_3 = _cursor.getInt(_cursorIndexOfElectricity);
            _item.electricity = _tmp_3 != 0;
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfContactPerson)) {
              _item.contactPerson = null;
            } else {
              _item.contactPerson = _cursor.getString(_cursorIndexOfContactPerson);
            }
            if (_cursor.isNull(_cursorIndexOfPhone)) {
              _item.phone = null;
            } else {
              _item.phone = _cursor.getString(_cursorIndexOfPhone);
            }
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _item.imageUrl = null;
            } else {
              _item.imageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfUpdatedAt)) {
              _item.updatedAt = null;
            } else {
              _item.updatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            }
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public LiveData<List<ShelterEntity>> getNearby(final double minLat, final double maxLat,
      final double minLng, final double maxLng) {
    final String _sql = "SELECT * FROM shelters WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 4);
    int _argIndex = 1;
    _statement.bindDouble(_argIndex, minLat);
    _argIndex = 2;
    _statement.bindDouble(_argIndex, maxLat);
    _argIndex = 3;
    _statement.bindDouble(_argIndex, minLng);
    _argIndex = 4;
    _statement.bindDouble(_argIndex, maxLng);
    return __db.getInvalidationTracker().createLiveData(new String[] {"shelters"}, false, new Callable<List<ShelterEntity>>() {
      @Override
      @Nullable
      public List<ShelterEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfCapacity = CursorUtil.getColumnIndexOrThrow(_cursor, "capacity");
          final int _cursorIndexOfCurrentOccupancy = CursorUtil.getColumnIndexOrThrow(_cursor, "currentOccupancy");
          final int _cursorIndexOfWater = CursorUtil.getColumnIndexOrThrow(_cursor, "water");
          final int _cursorIndexOfFood = CursorUtil.getColumnIndexOrThrow(_cursor, "food");
          final int _cursorIndexOfMedical = CursorUtil.getColumnIndexOrThrow(_cursor, "medical");
          final int _cursorIndexOfElectricity = CursorUtil.getColumnIndexOrThrow(_cursor, "electricity");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfContactPerson = CursorUtil.getColumnIndexOrThrow(_cursor, "contactPerson");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfImageUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "imageUrl");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<ShelterEntity> _result = new ArrayList<ShelterEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ShelterEntity _item;
            _item = new ShelterEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfName)) {
              _item.name = null;
            } else {
              _item.name = _cursor.getString(_cursorIndexOfName);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            _item.capacity = _cursor.getInt(_cursorIndexOfCapacity);
            _item.currentOccupancy = _cursor.getInt(_cursorIndexOfCurrentOccupancy);
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfWater);
            _item.water = _tmp != 0;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfFood);
            _item.food = _tmp_1 != 0;
            final int _tmp_2;
            _tmp_2 = _cursor.getInt(_cursorIndexOfMedical);
            _item.medical = _tmp_2 != 0;
            final int _tmp_3;
            _tmp_3 = _cursor.getInt(_cursorIndexOfElectricity);
            _item.electricity = _tmp_3 != 0;
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfContactPerson)) {
              _item.contactPerson = null;
            } else {
              _item.contactPerson = _cursor.getString(_cursorIndexOfContactPerson);
            }
            if (_cursor.isNull(_cursorIndexOfPhone)) {
              _item.phone = null;
            } else {
              _item.phone = _cursor.getString(_cursorIndexOfPhone);
            }
            if (_cursor.isNull(_cursorIndexOfImageUrl)) {
              _item.imageUrl = null;
            } else {
              _item.imageUrl = _cursor.getString(_cursorIndexOfImageUrl);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfUpdatedAt)) {
              _item.updatedAt = null;
            } else {
              _item.updatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            }
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
