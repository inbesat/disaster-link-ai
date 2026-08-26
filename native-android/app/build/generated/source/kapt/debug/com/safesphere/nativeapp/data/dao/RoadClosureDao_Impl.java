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
import com.safesphere.nativeapp.data.entity.RoadClosureEntity;
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
public final class RoadClosureDao_Impl implements RoadClosureDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<RoadClosureEntity> __insertionAdapterOfRoadClosureEntity;

  private final EntityDeletionOrUpdateAdapter<RoadClosureEntity> __updateAdapterOfRoadClosureEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public RoadClosureDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfRoadClosureEntity = new EntityInsertionAdapter<RoadClosureEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `road_closures` (`id`,`lat`,`lng`,`roadName`,`description`,`active`,`createdAt`,`updatedAt`) VALUES (?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final RoadClosureEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        statement.bindDouble(2, entity.lat);
        statement.bindDouble(3, entity.lng);
        if (entity.roadName == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.roadName);
        }
        if (entity.description == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.description);
        }
        final int _tmp = entity.active ? 1 : 0;
        statement.bindLong(6, _tmp);
        if (entity.createdAt == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.createdAt);
        }
        if (entity.updatedAt == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.updatedAt);
        }
      }
    };
    this.__updateAdapterOfRoadClosureEntity = new EntityDeletionOrUpdateAdapter<RoadClosureEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `road_closures` SET `id` = ?,`lat` = ?,`lng` = ?,`roadName` = ?,`description` = ?,`active` = ?,`createdAt` = ?,`updatedAt` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final RoadClosureEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        statement.bindDouble(2, entity.lat);
        statement.bindDouble(3, entity.lng);
        if (entity.roadName == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.roadName);
        }
        if (entity.description == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.description);
        }
        final int _tmp = entity.active ? 1 : 0;
        statement.bindLong(6, _tmp);
        if (entity.createdAt == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.createdAt);
        }
        if (entity.updatedAt == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.updatedAt);
        }
        if (entity.id == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.id);
        }
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM road_closures";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<RoadClosureEntity> closures) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfRoadClosureEntity.insert(closures);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final RoadClosureEntity closure) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfRoadClosureEntity.insert(closure);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final RoadClosureEntity closure) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfRoadClosureEntity.handle(closure);
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
  public LiveData<RoadClosureEntity> getById(final String id) {
    final String _sql = "SELECT * FROM road_closures WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (id == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, id);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"road_closures"}, false, new Callable<RoadClosureEntity>() {
      @Override
      @Nullable
      public RoadClosureEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfRoadName = CursorUtil.getColumnIndexOrThrow(_cursor, "roadName");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfActive = CursorUtil.getColumnIndexOrThrow(_cursor, "active");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final RoadClosureEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new RoadClosureEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _result.id = null;
            } else {
              _result.id = _cursor.getString(_cursorIndexOfId);
            }
            _result.lat = _cursor.getDouble(_cursorIndexOfLat);
            _result.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfRoadName)) {
              _result.roadName = null;
            } else {
              _result.roadName = _cursor.getString(_cursorIndexOfRoadName);
            }
            if (_cursor.isNull(_cursorIndexOfDescription)) {
              _result.description = null;
            } else {
              _result.description = _cursor.getString(_cursorIndexOfDescription);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfActive);
            _result.active = _tmp != 0;
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
  public LiveData<List<RoadClosureEntity>> getActive() {
    final String _sql = "SELECT * FROM road_closures WHERE active = 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"road_closures"}, false, new Callable<List<RoadClosureEntity>>() {
      @Override
      @Nullable
      public List<RoadClosureEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfRoadName = CursorUtil.getColumnIndexOrThrow(_cursor, "roadName");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfActive = CursorUtil.getColumnIndexOrThrow(_cursor, "active");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<RoadClosureEntity> _result = new ArrayList<RoadClosureEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final RoadClosureEntity _item;
            _item = new RoadClosureEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfRoadName)) {
              _item.roadName = null;
            } else {
              _item.roadName = _cursor.getString(_cursorIndexOfRoadName);
            }
            if (_cursor.isNull(_cursorIndexOfDescription)) {
              _item.description = null;
            } else {
              _item.description = _cursor.getString(_cursorIndexOfDescription);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfActive);
            _item.active = _tmp != 0;
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
  public LiveData<List<RoadClosureEntity>> getAll() {
    final String _sql = "SELECT * FROM road_closures";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"road_closures"}, false, new Callable<List<RoadClosureEntity>>() {
      @Override
      @Nullable
      public List<RoadClosureEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfRoadName = CursorUtil.getColumnIndexOrThrow(_cursor, "roadName");
          final int _cursorIndexOfDescription = CursorUtil.getColumnIndexOrThrow(_cursor, "description");
          final int _cursorIndexOfActive = CursorUtil.getColumnIndexOrThrow(_cursor, "active");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<RoadClosureEntity> _result = new ArrayList<RoadClosureEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final RoadClosureEntity _item;
            _item = new RoadClosureEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfRoadName)) {
              _item.roadName = null;
            } else {
              _item.roadName = _cursor.getString(_cursorIndexOfRoadName);
            }
            if (_cursor.isNull(_cursorIndexOfDescription)) {
              _item.description = null;
            } else {
              _item.description = _cursor.getString(_cursorIndexOfDescription);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfActive);
            _item.active = _tmp != 0;
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
