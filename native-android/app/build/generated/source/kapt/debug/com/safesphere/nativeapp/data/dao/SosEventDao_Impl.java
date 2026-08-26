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
import com.safesphere.nativeapp.data.entity.SosEventEntity;
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
public final class SosEventDao_Impl implements SosEventDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<SosEventEntity> __insertionAdapterOfSosEventEntity;

  private final EntityDeletionOrUpdateAdapter<SosEventEntity> __updateAdapterOfSosEventEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public SosEventDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfSosEventEntity = new EntityInsertionAdapter<SosEventEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `sos_events` (`id`,`userId`,`type`,`lat`,`lng`,`message`,`status`,`resolution`,`createdAt`,`resolvedAt`) VALUES (?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final SosEventEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.userId == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.userId);
        }
        if (entity.type == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.type);
        }
        statement.bindDouble(4, entity.lat);
        statement.bindDouble(5, entity.lng);
        if (entity.message == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.message);
        }
        if (entity.status == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.status);
        }
        if (entity.resolution == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.resolution);
        }
        if (entity.createdAt == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.createdAt);
        }
        if (entity.resolvedAt == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.resolvedAt);
        }
      }
    };
    this.__updateAdapterOfSosEventEntity = new EntityDeletionOrUpdateAdapter<SosEventEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `sos_events` SET `id` = ?,`userId` = ?,`type` = ?,`lat` = ?,`lng` = ?,`message` = ?,`status` = ?,`resolution` = ?,`createdAt` = ?,`resolvedAt` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final SosEventEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.userId == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.userId);
        }
        if (entity.type == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.type);
        }
        statement.bindDouble(4, entity.lat);
        statement.bindDouble(5, entity.lng);
        if (entity.message == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.message);
        }
        if (entity.status == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.status);
        }
        if (entity.resolution == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.resolution);
        }
        if (entity.createdAt == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.createdAt);
        }
        if (entity.resolvedAt == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.resolvedAt);
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
        final String _query = "DELETE FROM sos_events";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<SosEventEntity> events) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfSosEventEntity.insert(events);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final SosEventEntity event) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfSosEventEntity.insert(event);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final SosEventEntity event) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfSosEventEntity.handle(event);
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
  public LiveData<List<SosEventEntity>> getByUserId(final String userId) {
    final String _sql = "SELECT * FROM sos_events WHERE userId = ? ORDER BY createdAt DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (userId == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, userId);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"sos_events"}, false, new Callable<List<SosEventEntity>>() {
      @Override
      @Nullable
      public List<SosEventEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfResolution = CursorUtil.getColumnIndexOrThrow(_cursor, "resolution");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfResolvedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "resolvedAt");
          final List<SosEventEntity> _result = new ArrayList<SosEventEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SosEventEntity _item;
            _item = new SosEventEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _item.userId = null;
            } else {
              _item.userId = _cursor.getString(_cursorIndexOfUserId);
            }
            if (_cursor.isNull(_cursorIndexOfType)) {
              _item.type = null;
            } else {
              _item.type = _cursor.getString(_cursorIndexOfType);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfMessage)) {
              _item.message = null;
            } else {
              _item.message = _cursor.getString(_cursorIndexOfMessage);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfResolution)) {
              _item.resolution = null;
            } else {
              _item.resolution = _cursor.getString(_cursorIndexOfResolution);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfResolvedAt)) {
              _item.resolvedAt = null;
            } else {
              _item.resolvedAt = _cursor.getString(_cursorIndexOfResolvedAt);
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
  public LiveData<SosEventEntity> getById(final String id) {
    final String _sql = "SELECT * FROM sos_events WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (id == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, id);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"sos_events"}, false, new Callable<SosEventEntity>() {
      @Override
      @Nullable
      public SosEventEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfResolution = CursorUtil.getColumnIndexOrThrow(_cursor, "resolution");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfResolvedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "resolvedAt");
          final SosEventEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new SosEventEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _result.id = null;
            } else {
              _result.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _result.userId = null;
            } else {
              _result.userId = _cursor.getString(_cursorIndexOfUserId);
            }
            if (_cursor.isNull(_cursorIndexOfType)) {
              _result.type = null;
            } else {
              _result.type = _cursor.getString(_cursorIndexOfType);
            }
            _result.lat = _cursor.getDouble(_cursorIndexOfLat);
            _result.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfMessage)) {
              _result.message = null;
            } else {
              _result.message = _cursor.getString(_cursorIndexOfMessage);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _result.status = null;
            } else {
              _result.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfResolution)) {
              _result.resolution = null;
            } else {
              _result.resolution = _cursor.getString(_cursorIndexOfResolution);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _result.createdAt = null;
            } else {
              _result.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfResolvedAt)) {
              _result.resolvedAt = null;
            } else {
              _result.resolvedAt = _cursor.getString(_cursorIndexOfResolvedAt);
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
  public LiveData<List<SosEventEntity>> getAll() {
    final String _sql = "SELECT * FROM sos_events ORDER BY createdAt DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"sos_events"}, false, new Callable<List<SosEventEntity>>() {
      @Override
      @Nullable
      public List<SosEventEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfResolution = CursorUtil.getColumnIndexOrThrow(_cursor, "resolution");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfResolvedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "resolvedAt");
          final List<SosEventEntity> _result = new ArrayList<SosEventEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SosEventEntity _item;
            _item = new SosEventEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _item.userId = null;
            } else {
              _item.userId = _cursor.getString(_cursorIndexOfUserId);
            }
            if (_cursor.isNull(_cursorIndexOfType)) {
              _item.type = null;
            } else {
              _item.type = _cursor.getString(_cursorIndexOfType);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfMessage)) {
              _item.message = null;
            } else {
              _item.message = _cursor.getString(_cursorIndexOfMessage);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfResolution)) {
              _item.resolution = null;
            } else {
              _item.resolution = _cursor.getString(_cursorIndexOfResolution);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfResolvedAt)) {
              _item.resolvedAt = null;
            } else {
              _item.resolvedAt = _cursor.getString(_cursorIndexOfResolvedAt);
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
