const ConcatSource = require("webpack-sources").ConcatSource
const { flow, get } = require("lodash")
const execSync = require("child_process").execSync
const dayjs = require("dayjs")
const NODE_ENV = process.env.NODE_ENV
export default function CreateVersionRecord(setting) {
  const defaultConfig = {
    name: "VersionRecord",
    isFileAdd(name) {
      return name.includes("mian")
    },
    getString(branchName, commitId, tag, date) {
      return `${branchName}-${commitId}-${tag}-${date}`
    },
    valueKey: "version",
    checkEnvironment: true
  }
  const {
    name,
    isFileAdd,
    getString,
    valueKey,
    checkEnvironment
  } = Object.assign(defaultConfig, setting)
  class VersionRecord {
    // @LimitEnvironment(checkEnvironment)
    apply(compiler) {
      compiler.hooks.compilation.tap(name, compilation => {
        compilation.hooks.optimizeChunkAssets.tap(name, chunks => {
          let isAdd = false
          chunks.forEach(chunk => {
            if (isAdd) {
              return
            }
            chunk.files.forEach(fileName => {
              if (isAdd) {
                return
              }
              if (isFileAdd(fileName)) {
                compilation.assets[fileName] = new ConcatSource(
                  compilation.assets[fileName],
                  `;window[${valueKey}]${getString(...getVersionInfo())}`
                )
                isAdd = true
              }
            })
          })
        })
      })
    }
  }
  decoratorsPollfill(VersionRecord.prototype,'apply',LimitEnvironment(checkEnvironment))
  return VersionRecord
}
function getVersionInfo() {
  const branchName = getBranchName()
  const commitId = getCommitID()
  const tag = getTag()
  const date = dayjs().format("YYYY-MM-DD HH:mm:ss")
  return [branchName, commitId, tag, date]
}
// 获取当前分支名
function getBranchName() {
  const branchList = execSync("git branch").toString()
  const split = s => s.split("\n")
  const filter = s => s.filter(item => item.includes("*"))[0]
  const replace = s => s.replace("* ", "")
  return flow(split, filter, replace)(branchList)
}
// 获取当前commitId
function getCommitID() {
  const idList = execSync("git log -1").toString()
  const split = s => s.split("\n")
  const filter = s => s.filter(item => item.includes("commit"))[0]
  const replaceStart = s => s.replace("commit ", "")
  const replaceEnd = s => s.replace(" .*", "")
  return flow(split, filter, replaceStart, replaceEnd)(idList)
}
// 获取tag
function getTag() {
  const list = execSync("git tag ").toString()
  const split = s => s.split("\n")
  const getFirst = s => get(s, 0, "null")
  return flow(split, getFirst)(list)
}

//
function LimitEnvironment(checkEnvironment) {
  const cancel = function(target, name, descriptor) {
    return { ...descriptor, value() {} }
  }
  if (checkEnvironment === false) {
    return cancel
  }
  if (typeof checkEnvironment === "string" && checkEnvironment !== NODE_ENV) {
    return cancel
  }
  if (Array.isArray(checkEnvironment) && !checkEnvironment.includes(NODE_ENV)) {
    return cancel
  }
  return function(target, name, descriptor) {
    return descriptor
  }
}

/**
 * 不支持ts装饰器可以使用本代码
 */
function decoratorsPollfill(prototype, key, desc, modifyer) {
    Object.defineProperty(
      prototype,
      key,
      modifyer(prototype, key, Object.getOwnPropertyDescriptor(prototype, key))
    )
  }
  