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
import com.safesphere.nativeapp.data.entity.KnowledgeDocEntity;
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
public final class KnowledgeDocDao_Impl implements KnowledgeDocDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<KnowledgeDocEntity> __insertionAdapterOfKnowledgeDocEntity;

  private final EntityDeletionOrUpdateAdapter<KnowledgeDocEntity> __updateAdapterOfKnowledgeDocEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public KnowledgeDocDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfKnowledgeDocEntity = new EntityInsertionAdapter<KnowledgeDocEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `knowledge_docs` (`id`,`title`,`district`,`documentType`,`content`,`embedding`,`createdAt`,`updatedAt`) VALUES (?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final KnowledgeDocEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.title == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.title);
        }
        if (entity.district == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.district);
        }
        if (entity.documentType == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.documentType);
        }
        if (entity.content == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.content);
        }
        if (entity.embedding == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.embedding);
        }
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
    this.__updateAdapterOfKnowledgeDocEntity = new EntityDeletionOrUpdateAdapter<KnowledgeDocEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `knowledge_docs` SET `id` = ?,`title` = ?,`district` = ?,`documentType` = ?,`content` = ?,`embedding` = ?,`createdAt` = ?,`updatedAt` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final KnowledgeDocEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.title == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.title);
        }
        if (entity.district == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.district);
        }
        if (entity.documentType == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.documentType);
        }
        if (entity.content == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.content);
        }
        if (entity.embedding == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.embedding);
        }
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
        final String _query = "DELETE FROM knowledge_docs";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<KnowledgeDocEntity> docs) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfKnowledgeDocEntity.insert(docs);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final KnowledgeDocEntity doc) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfKnowledgeDocEntity.insert(doc);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final KnowledgeDocEntity doc) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfKnowledgeDocEntity.handle(doc);
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
  public LiveData<KnowledgeDocEntity> getById(final String id) {
    final String _sql = "SELECT * FROM knowledge_docs WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (id == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, id);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"knowledge_docs"}, false, new Callable<KnowledgeDocEntity>() {
      @Override
      @Nullable
      public KnowledgeDocEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTitle = CursorUtil.getColumnIndexOrThrow(_cursor, "title");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfDocumentType = CursorUtil.getColumnIndexOrThrow(_cursor, "documentType");
          final int _cursorIndexOfContent = CursorUtil.getColumnIndexOrThrow(_cursor, "content");
          final int _cursorIndexOfEmbedding = CursorUtil.getColumnIndexOrThrow(_cursor, "embedding");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final KnowledgeDocEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new KnowledgeDocEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _result.id = null;
            } else {
              _result.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfTitle)) {
              _result.title = null;
            } else {
              _result.title = _cursor.getString(_cursorIndexOfTitle);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _result.district = null;
            } else {
              _result.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfDocumentType)) {
              _result.documentType = null;
            } else {
              _result.documentType = _cursor.getString(_cursorIndexOfDocumentType);
            }
            if (_cursor.isNull(_cursorIndexOfContent)) {
              _result.content = null;
            } else {
              _result.content = _cursor.getString(_cursorIndexOfContent);
            }
            if (_cursor.isNull(_cursorIndexOfEmbedding)) {
              _result.embedding = null;
            } else {
              _result.embedding = _cursor.getString(_cursorIndexOfEmbedding);
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
  public LiveData<List<KnowledgeDocEntity>> getByDistrict(final String district) {
    final String _sql = "SELECT * FROM knowledge_docs WHERE district = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (district == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, district);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"knowledge_docs"}, false, new Callable<List<KnowledgeDocEntity>>() {
      @Override
      @Nullable
      public List<KnowledgeDocEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTitle = CursorUtil.getColumnIndexOrThrow(_cursor, "title");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfDocumentType = CursorUtil.getColumnIndexOrThrow(_cursor, "documentType");
          final int _cursorIndexOfContent = CursorUtil.getColumnIndexOrThrow(_cursor, "content");
          final int _cursorIndexOfEmbedding = CursorUtil.getColumnIndexOrThrow(_cursor, "embedding");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<KnowledgeDocEntity> _result = new ArrayList<KnowledgeDocEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final KnowledgeDocEntity _item;
            _item = new KnowledgeDocEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfTitle)) {
              _item.title = null;
            } else {
              _item.title = _cursor.getString(_cursorIndexOfTitle);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfDocumentType)) {
              _item.documentType = null;
            } else {
              _item.documentType = _cursor.getString(_cursorIndexOfDocumentType);
            }
            if (_cursor.isNull(_cursorIndexOfContent)) {
              _item.content = null;
            } else {
              _item.content = _cursor.getString(_cursorIndexOfContent);
            }
            if (_cursor.isNull(_cursorIndexOfEmbedding)) {
              _item.embedding = null;
            } else {
              _item.embedding = _cursor.getString(_cursorIndexOfEmbedding);
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
  public LiveData<List<KnowledgeDocEntity>> getByType(final String type) {
    final String _sql = "SELECT * FROM knowledge_docs WHERE documentType = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (type == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, type);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"knowledge_docs"}, false, new Callable<List<KnowledgeDocEntity>>() {
      @Override
      @Nullable
      public List<KnowledgeDocEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTitle = CursorUtil.getColumnIndexOrThrow(_cursor, "title");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfDocumentType = CursorUtil.getColumnIndexOrThrow(_cursor, "documentType");
          final int _cursorIndexOfContent = CursorUtil.getColumnIndexOrThrow(_cursor, "content");
          final int _cursorIndexOfEmbedding = CursorUtil.getColumnIndexOrThrow(_cursor, "embedding");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<KnowledgeDocEntity> _result = new ArrayList<KnowledgeDocEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final KnowledgeDocEntity _item;
            _item = new KnowledgeDocEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfTitle)) {
              _item.title = null;
            } else {
              _item.title = _cursor.getString(_cursorIndexOfTitle);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfDocumentType)) {
              _item.documentType = null;
            } else {
              _item.documentType = _cursor.getString(_cursorIndexOfDocumentType);
            }
            if (_cursor.isNull(_cursorIndexOfContent)) {
              _item.content = null;
            } else {
              _item.content = _cursor.getString(_cursorIndexOfContent);
            }
            if (_cursor.isNull(_cursorIndexOfEmbedding)) {
              _item.embedding = null;
            } else {
              _item.embedding = _cursor.getString(_cursorIndexOfEmbedding);
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
  public LiveData<List<KnowledgeDocEntity>> getAll() {
    final String _sql = "SELECT * FROM knowledge_docs ORDER BY createdAt DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"knowledge_docs"}, false, new Callable<List<KnowledgeDocEntity>>() {
      @Override
      @Nullable
      public List<KnowledgeDocEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTitle = CursorUtil.getColumnIndexOrThrow(_cursor, "title");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfDocumentType = CursorUtil.getColumnIndexOrThrow(_cursor, "documentType");
          final int _cursorIndexOfContent = CursorUtil.getColumnIndexOrThrow(_cursor, "content");
          final int _cursorIndexOfEmbedding = CursorUtil.getColumnIndexOrThrow(_cursor, "embedding");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<KnowledgeDocEntity> _result = new ArrayList<KnowledgeDocEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final KnowledgeDocEntity _item;
            _item = new KnowledgeDocEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfTitle)) {
              _item.title = null;
            } else {
              _item.title = _cursor.getString(_cursorIndexOfTitle);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfDocumentType)) {
              _item.documentType = null;
            } else {
              _item.documentType = _cursor.getString(_cursorIndexOfDocumentType);
            }
            if (_cursor.isNull(_cursorIndexOfContent)) {
              _item.content = null;
            } else {
              _item.content = _cursor.getString(_cursorIndexOfContent);
            }
            if (_cursor.isNull(_cursorIndexOfEmbedding)) {
              _item.embedding = null;
            } else {
              _item.embedding = _cursor.getString(_cursorIndexOfEmbedding);
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
  public LiveData<List<KnowledgeDocEntity>> getWithoutEmbeddings() {
    final String _sql = "SELECT * FROM knowledge_docs WHERE embedding IS NULL LIMIT 50";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"knowledge_docs"}, false, new Callable<List<KnowledgeDocEntity>>() {
      @Override
      @Nullable
      public List<KnowledgeDocEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTitle = CursorUtil.getColumnIndexOrThrow(_cursor, "title");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfDocumentType = CursorUtil.getColumnIndexOrThrow(_cursor, "documentType");
          final int _cursorIndexOfContent = CursorUtil.getColumnIndexOrThrow(_cursor, "content");
          final int _cursorIndexOfEmbedding = CursorUtil.getColumnIndexOrThrow(_cursor, "embedding");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<KnowledgeDocEntity> _result = new ArrayList<KnowledgeDocEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final KnowledgeDocEntity _item;
            _item = new KnowledgeDocEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfTitle)) {
              _item.title = null;
            } else {
              _item.title = _cursor.getString(_cursorIndexOfTitle);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfDocumentType)) {
              _item.documentType = null;
            } else {
              _item.documentType = _cursor.getString(_cursorIndexOfDocumentType);
            }
            if (_cursor.isNull(_cursorIndexOfContent)) {
              _item.content = null;
            } else {
              _item.content = _cursor.getString(_cursorIndexOfContent);
            }
            if (_cursor.isNull(_cursorIndexOfEmbedding)) {
              _item.embedding = null;
            } else {
              _item.embedding = _cursor.getString(_cursorIndexOfEmbedding);
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
