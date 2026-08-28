const express = require('express');
const app = express();
const PORT = 3000;

const { executeQuery, closePool } = require('./db');

app.use(express.json());

function handleServerError(res, error, message = 'サーバーエラー') {
  console.error(error);
  res.status(500).json({ error: message });
}

// ToDo作成
app.post('/todos', async (req, res) => {
  const { title, priority } = req.body;

  try {
    const result = await executeQuery(
      'INSERT INTO todos (title, priority) VALUES (?, ?);',
      [title, priority]
    );

    res.status(201).json({
      id: result.insertId,
      title,
      priority,
      status: '未着手'
    });
  } catch (err) {
    handleServerError(res, err, 'ToDo追加に失敗しました');
  }
});

// ToDo一覧取得
app.get('/todos', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM todos;');
    res.status(200).json(rows);
  } catch (err) {
    handleServerError(res, err);
  }
});

// ToDo更新
app.put('/todos/:id', async (req, res) => {
  const { title, priority, status } = req.body;

  try {
    const result = await executeQuery(
      'UPDATE todos SET title = ?, priority = ?, status = ? WHERE id = ?;',
      [title, priority, status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: '更新対象のToDoが見つかりません'
      });
    }

    res.status(200).json({
      id: req.params.id,
      title,
      priority,
      status
    });
  } catch (err) {
    handleServerError(res, err, 'ToDo更新に失敗しました');
  }
});

// ToDo削除
app.delete('/todos/:id', async (req, res) => {
  try {
    const result = await executeQuery(
      'DELETE FROM todos WHERE id = ?;',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: '削除対象のToDoが見つかりません'
      });
    }

    res.status(200).json({
      message: 'ToDoを削除しました'
    });
  } catch (err) {
    handleServerError(res, err, 'ToDo削除に失敗しました');
  }
});

// アプリ終了時にDB接続を閉じる
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`${signal}を受信しました。終了処理中...`);
    await closePool();
    process.exit();
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`${PORT}番ポートでWebサーバーが起動しました。`);
});