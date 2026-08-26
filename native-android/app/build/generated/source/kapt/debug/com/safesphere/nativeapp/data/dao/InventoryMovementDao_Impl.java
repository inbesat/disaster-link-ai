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
import com.safesphere.nativeapp.data.entity.InventoryMovementEntity;
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
public final class InventoryMovementDao_Impl implements InventoryMovementDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<InventoryMovementEntity> __insertionAdapterOfInventoryMovementEntity;

  private final EntityDeletionOrUpdateAdapter<InventoryMovementEntity> __updateAdapterOfInventoryMovementEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public InventoryMovementDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfInventoryMovementEntity = new EntityInsertionAdapter<InventoryMovementEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `inventory_movements` (`id`,`resourceId`,`fromDepot`,`toDepot`,`quantity`,`timestamp`,`status`) VALUES (?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final InventoryMovementEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.resourceId == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.resourceId);
        }
        if (entity.fromDepot == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.fromDepot);
        }
        if (entity.toDepot == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.toDepot);
        }
        statement.bindLong(5, entity.quantity);
        if (entity.timestamp == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.timestamp);
        }
        if (entity.status == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.status);
        }
      }
    };
    this.__updateAdapterOfInventoryMovementEntity = new EntityDeletionOrUpdateAdapter<InventoryMovementEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `inventory_movements` SET `id` = ?,`resourceId` = ?,`fromDepot` = ?,`toDepot` = ?,`quantity` = ?,`timestamp` = ?,`status` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final InventoryMovementEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.resourceId == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.resourceId);
        }
        if (entity.fromDepot == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.fromDepot);
        }
        if (entity.toDepot == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.toDepot);
        }
        statement.bindLong(5, entity.quantity);
        if (entity.timestamp == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.timestamp);
        }
        if (entity.status == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.status);
        }
        if (entity.id == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.id);
        }
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM inventory_movements";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<InventoryMovementEntity> movements) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfInventoryMovementEntity.insert(movements);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final InventoryMovementEntity movement) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfInventoryMovementEntity.insert(movement);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final InventoryMovementEntity movement) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfInventoryMovementEntity.handle(movement);
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
  public LiveData<List<InventoryMovementEntity>> getByResourceId(final String resourceId) {
    final String _sql = "SELECT * FROM inventory_movements WHERE resourceId = ? ORDER BY timestamp DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (resourceId == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, resourceId);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"inventory_movements"}, false, new Callable<List<InventoryMovementEntity>>() {
      @Override
      @Nullable
      public List<InventoryMovementEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfResourceId = CursorUtil.getColumnIndexOrThrow(_cursor, "resourceId");
          final int _cursorIndexOfFromDepot = CursorUtil.getColumnIndexOrThrow(_cursor, "fromDepot");
          final int _cursorIndexOfToDepot = CursorUtil.getColumnIndexOrThrow(_cursor, "toDepot");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final List<InventoryMovementEntity> _result = new ArrayList<InventoryMovementEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final InventoryMovementEntity _item;
            _item = new InventoryMovementEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfResourceId)) {
              _item.resourceId = null;
            } else {
              _item.resourceId = _cursor.getString(_cursorIndexOfResourceId);
            }
            if (_cursor.isNull(_cursorIndexOfFromDepot)) {
              _item.fromDepot = null;
            } else {
              _item.fromDepot = _cursor.getString(_cursorIndexOfFromDepot);
            }
            if (_cursor.isNull(_cursorIndexOfToDepot)) {
              _item.toDepot = null;
            } else {
              _item.toDepot = _cursor.getString(_cursorIndexOfToDepot);
            }
            _item.quantity = _cursor.getInt(_cursorIndexOfQuantity);
            if (_cursor.isNull(_cursorIndexOfTimestamp)) {
              _item.timestamp = null;
            } else {
              _item.timestamp = _cursor.getString(_cursorIndexOfTimestamp);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
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
  public LiveData<List<InventoryMovementEntity>> getAll() {
    final String _sql = "SELECT * FROM inventory_movements ORDER BY timestamp DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"inventory_movements"}, false, new Callable<List<InventoryMovementEntity>>() {
      @Override
      @Nullable
      public List<InventoryMovementEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfResourceId = CursorUtil.getColumnIndexOrThrow(_cursor, "resourceId");
          final int _cursorIndexOfFromDepot = CursorUtil.getColumnIndexOrThrow(_cursor, "fromDepot");
          final int _cursorIndexOfToDepot = CursorUtil.getColumnIndexOrThrow(_cursor, "toDepot");
          final int _cursorIndexOfQuantity = CursorUtil.getColumnIndexOrThrow(_cursor, "quantity");
          final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final List<InventoryMovementEntity> _result = new ArrayList<InventoryMovementEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final InventoryMovementEntity _item;
            _item = new InventoryMovementEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfResourceId)) {
              _item.resourceId = null;
            } else {
              _item.resourceId = _cursor.getString(_cursorIndexOfResourceId);
            }
            if (_cursor.isNull(_cursorIndexOfFromDepot)) {
              _item.fromDepot = null;
            } else {
              _item.fromDepot = _cursor.getString(_cursorIndexOfFromDepot);
            }
            if (_cursor.isNull(_cursorIndexOfToDepot)) {
              _item.toDepot = null;
            } else {
              _item.toDepot = _cursor.getString(_cursorIndexOfToDepot);
            }
            _item.quantity = _cursor.getInt(_cursorIndexOfQuantity);
            if (_cursor.isNull(_cursorIndexOfTimestamp)) {
              _item.timestamp = null;
            } else {
              _item.timestamp = _cursor.getString(_cursorIndexOfTimestamp);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
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
