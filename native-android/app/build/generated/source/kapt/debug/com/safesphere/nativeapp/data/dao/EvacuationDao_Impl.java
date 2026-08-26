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
import com.safesphere.nativeapp.data.entity.EvacuationEntity;
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
public final class EvacuationDao_Impl implements EvacuationDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<EvacuationEntity> __insertionAdapterOfEvacuationEntity;

  private final EntityDeletionOrUpdateAdapter<EvacuationEntity> __updateAdapterOfEvacuationEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public EvacuationDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfEvacuationEntity = new EntityInsertionAdapter<EvacuationEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `evacuations` (`id`,`villageName`,`shelterName`,`evacuees`,`routeDurationSec`,`status`,`busesNeeded`,`boatsNeeded`,`createdAt`,`updatedAt`) VALUES (?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final EvacuationEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.villageName == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.villageName);
        }
        if (entity.shelterName == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.shelterName);
        }
        statement.bindLong(4, entity.evacuees);
        statement.bindLong(5, entity.routeDurationSec);
        if (entity.status == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.status);
        }
        statement.bindLong(7, entity.busesNeeded);
        statement.bindLong(8, entity.boatsNeeded);
        if (entity.createdAt == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.createdAt);
        }
        if (entity.updatedAt == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.updatedAt);
        }
      }
    };
    this.__updateAdapterOfEvacuationEntity = new EntityDeletionOrUpdateAdapter<EvacuationEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `evacuations` SET `id` = ?,`villageName` = ?,`shelterName` = ?,`evacuees` = ?,`routeDurationSec` = ?,`status` = ?,`busesNeeded` = ?,`boatsNeeded` = ?,`createdAt` = ?,`updatedAt` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final EvacuationEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.villageName == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.villageName);
        }
        if (entity.shelterName == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.shelterName);
        }
        statement.bindLong(4, entity.evacuees);
        statement.bindLong(5, entity.routeDurationSec);
        if (entity.status == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.status);
        }
        statement.bindLong(7, entity.busesNeeded);
        statement.bindLong(8, entity.boatsNeeded);
        if (entity.createdAt == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.createdAt);
        }
        if (entity.updatedAt == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.updatedAt);
        }
        if (entity.id == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.id);
        }
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM evacuations";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<EvacuationEntity> evacuations) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfEvacuationEntity.insert(evacuations);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final EvacuationEntity evacuation) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfEvacuationEntity.insert(evacuation);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final EvacuationEntity evacuation) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfEvacuationEntity.handle(evacuation);
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
  public LiveData<EvacuationEntity> getById(final String id) {
    final String _sql = "SELECT * FROM evacuations WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (id == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, id);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"evacuations"}, false, new Callable<EvacuationEntity>() {
      @Override
      @Nullable
      public EvacuationEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfVillageName = CursorUtil.getColumnIndexOrThrow(_cursor, "villageName");
          final int _cursorIndexOfShelterName = CursorUtil.getColumnIndexOrThrow(_cursor, "shelterName");
          final int _cursorIndexOfEvacuees = CursorUtil.getColumnIndexOrThrow(_cursor, "evacuees");
          final int _cursorIndexOfRouteDurationSec = CursorUtil.getColumnIndexOrThrow(_cursor, "routeDurationSec");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfBusesNeeded = CursorUtil.getColumnIndexOrThrow(_cursor, "busesNeeded");
          final int _cursorIndexOfBoatsNeeded = CursorUtil.getColumnIndexOrThrow(_cursor, "boatsNeeded");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final EvacuationEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new EvacuationEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _result.id = null;
            } else {
              _result.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfVillageName)) {
              _result.villageName = null;
            } else {
              _result.villageName = _cursor.getString(_cursorIndexOfVillageName);
            }
            if (_cursor.isNull(_cursorIndexOfShelterName)) {
              _result.shelterName = null;
            } else {
              _result.shelterName = _cursor.getString(_cursorIndexOfShelterName);
            }
            _result.evacuees = _cursor.getInt(_cursorIndexOfEvacuees);
            _result.routeDurationSec = _cursor.getInt(_cursorIndexOfRouteDurationSec);
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _result.status = null;
            } else {
              _result.status = _cursor.getString(_cursorIndexOfStatus);
            }
            _result.busesNeeded = _cursor.getInt(_cursorIndexOfBusesNeeded);
            _result.boatsNeeded = _cursor.getInt(_cursorIndexOfBoatsNeeded);
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
  public LiveData<List<EvacuationEntity>> getByStatus(final String status) {
    final String _sql = "SELECT * FROM evacuations WHERE status = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (status == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, status);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"evacuations"}, false, new Callable<List<EvacuationEntity>>() {
      @Override
      @Nullable
      public List<EvacuationEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfVillageName = CursorUtil.getColumnIndexOrThrow(_cursor, "villageName");
          final int _cursorIndexOfShelterName = CursorUtil.getColumnIndexOrThrow(_cursor, "shelterName");
          final int _cursorIndexOfEvacuees = CursorUtil.getColumnIndexOrThrow(_cursor, "evacuees");
          final int _cursorIndexOfRouteDurationSec = CursorUtil.getColumnIndexOrThrow(_cursor, "routeDurationSec");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfBusesNeeded = CursorUtil.getColumnIndexOrThrow(_cursor, "busesNeeded");
          final int _cursorIndexOfBoatsNeeded = CursorUtil.getColumnIndexOrThrow(_cursor, "boatsNeeded");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<EvacuationEntity> _result = new ArrayList<EvacuationEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final EvacuationEntity _item;
            _item = new EvacuationEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfVillageName)) {
              _item.villageName = null;
            } else {
              _item.villageName = _cursor.getString(_cursorIndexOfVillageName);
            }
            if (_cursor.isNull(_cursorIndexOfShelterName)) {
              _item.shelterName = null;
            } else {
              _item.shelterName = _cursor.getString(_cursorIndexOfShelterName);
            }
            _item.evacuees = _cursor.getInt(_cursorIndexOfEvacuees);
            _item.routeDurationSec = _cursor.getInt(_cursorIndexOfRouteDurationSec);
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            _item.busesNeeded = _cursor.getInt(_cursorIndexOfBusesNeeded);
            _item.boatsNeeded = _cursor.getInt(_cursorIndexOfBoatsNeeded);
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
  public LiveData<List<EvacuationEntity>> getAll() {
    final String _sql = "SELECT * FROM evacuations ORDER BY createdAt DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"evacuations"}, false, new Callable<List<EvacuationEntity>>() {
      @Override
      @Nullable
      public List<EvacuationEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfVillageName = CursorUtil.getColumnIndexOrThrow(_cursor, "villageName");
          final int _cursorIndexOfShelterName = CursorUtil.getColumnIndexOrThrow(_cursor, "shelterName");
          final int _cursorIndexOfEvacuees = CursorUtil.getColumnIndexOrThrow(_cursor, "evacuees");
          final int _cursorIndexOfRouteDurationSec = CursorUtil.getColumnIndexOrThrow(_cursor, "routeDurationSec");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfBusesNeeded = CursorUtil.getColumnIndexOrThrow(_cursor, "busesNeeded");
          final int _cursorIndexOfBoatsNeeded = CursorUtil.getColumnIndexOrThrow(_cursor, "boatsNeeded");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<EvacuationEntity> _result = new ArrayList<EvacuationEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final EvacuationEntity _item;
            _item = new EvacuationEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfVillageName)) {
              _item.villageName = null;
            } else {
              _item.villageName = _cursor.getString(_cursorIndexOfVillageName);
            }
            if (_cursor.isNull(_cursorIndexOfShelterName)) {
              _item.shelterName = null;
            } else {
              _item.shelterName = _cursor.getString(_cursorIndexOfShelterName);
            }
            _item.evacuees = _cursor.getInt(_cursorIndexOfEvacuees);
            _item.routeDurationSec = _cursor.getInt(_cursorIndexOfRouteDurationSec);
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            _item.busesNeeded = _cursor.getInt(_cursorIndexOfBusesNeeded);
            _item.boatsNeeded = _cursor.getInt(_cursorIndexOfBoatsNeeded);
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
