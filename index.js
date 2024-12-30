const express = require('express')
const mysql = require('mysql')
const util = require('util')
const config = require('./config')

let con = mysql.createConnection({
  host: config.host,
  database: config.database,
  user: config.user,
  password: config.password
})

let query = util.promisify(con.query).bind(con)

let app = express()
app.use(express.static('public'))
app.get('/api/products', async (req, res) => {
  let page = req.query.page || 1
  let size = parseInt(req.query.size) || 10
  let offset = (page - 1) * size
  let order = mysql.raw(req.query.order || 'id')
  let direction = mysql.raw(req.query.direction || 'asc')
  let params = [ order, direction, size, offset ]
  let sql = 'select * from product'
  let search = req.query.search
  if (search) {
    search = `%${search}%`
    sql = `select * from product where name like ?`
    params.unshift(search)
  }
  let count = (await query(sql.replace('*', 'count(*) as count'), search))[0].count
  let data = (await query(`${sql} order by ? ? limit ? offset ?`, params))
  res.send({ data, count })
})
app.listen(8000)