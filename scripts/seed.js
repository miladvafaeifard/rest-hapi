'use strict'

let mongoose = require('mongoose')
let config = require('../config')
let restHapi = require('../rest-hapi')
let path = require('path')
let fs = require('fs-extra')(async function seed() {
  restHapi.config.loglevel = 'DEBUG'
  let Log = restHapi.getLogger('seed')
  try {
    await moveModels()

    mongoose.Promise = Promise

    mongoose.connect(restHapi.config.mongo.URI)

    let models = await restHapi.generateModels(mongoose)

    let password = 'root'

    await dropCollections(models)

    Log.log('seeding roles')
    let roles = [
      {
        name: 'Account',
        description: 'A standard user account.'
      },
      {
        name: 'Admin',
        description: 'A user with advanced permissions.'
      },
      {
        name: 'SuperAdmin',
        description: 'A user with full permissions.'
      }
    ]

    await restHapi.create(models.role, roles, Log)

    Log.log('seeding users')
    let users = [
      {
        email: 'test@account.com',
        password: password,
        role: roles[0]._id
      },
      {
        email: 'test@admin.com',
        password: password,
        role: roles[1]._id
      },
      {
        email: 'test@superadmin.com',
        password: password,
        role: roles[2]._id
      }
    ]
    await restHapi.create(models.user, users, Log)
  } catch (err) {
    console.error(err)
  }
})()

function moveModels() {
  return new Promise((resolve, reject) => {
    fs.copy(
      './seed/**/*.*',
      path.join(__dirname, '/../../../', config.modelPath),
      err => {
        if (err) {
          reject(err)
        }
        resolve()
      }
    )
  })
}

async function dropCollections(models) {
  restHapi.config.loglevel = 'LOG'
  let Log = restHapi.getLogger('unseed')
  try {
    await models.user.remove({})
    Log.log('roles removed')
    await models.role.remove({})
    Log.log('users removed')
  } catch (err) {
    Log.error(err)
  }
}
