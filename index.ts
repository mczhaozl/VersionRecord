const ConcatSource = require('webpack-sources').ConcatSource
const { flow, get } = require('lodash')
const execSync = require('child_process').execSync
const dayjs = require('dayjs')

export default function CreateVersionRecord(setting) {
    const { name, isFileAdd, getString } = Object.assign({}, setting)
    class VersionRecord {
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
                                    `;${getString(...getVersionInfo())}`
                                )
                                isAdd = true
                            }
                        })
                    })
                })
            })
        }
    }
    return VersionRecord
}
function getVersionInfo() {
    const branchName = getBranchName()
    const commitId = getCommitID()
    const tag = getTag()
    const date = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return [branchName, commitId, tag, date]
}
// 获取当前分支名
function getBranchName() {
    const branchList = execSync('git branch').toString()
    const split = s => s.split('\n')
    const filter = s => s.filter(item => item.includes('*'))[0]
    const replace = s => s.replace('* ', '')
    return flow(split, filter, replace)(branchList)
}
// 获取当前commitId
function getCommitID() {
    const idList = execSync('git log -1').toString()
    const split = s => s.split('\n')
    const filter = s => s.filter(item => item.includes('commit'))[0]
    const replaceStart = s => s.replace('commit ', '')
    const replaceEnd = s => s.replace(' .*', '')
    return flow(split, filter, replaceStart, replaceEnd)(idList)
}
// 获取tag
function getTag() {
    const list = execSync('git tag ').toString()
    const split = s => s.split('\n')
    const getFirst = s => get(s, 0, 'null')
    return flow(split, getFirst)(list)
}