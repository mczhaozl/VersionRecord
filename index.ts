const ConcatSource = require('webpack-sources').ConcatSource
const { flow, get } = require('lodash')
const execSync = require('child_process').execSync
const dayjs = require('dayjs')
const NODE_ENV = process.env.NODE_ENV as string
type ISetting = {
    name?: String,
    isFileAdd?: (fileName: String) => Boolean,
    getString?: (branchName: string, commitId: String, tag: String, date: String) => String,
    valueKey?: String,
    checkEnvironment?: Array<String> | String | Boolean
}
type IStringer = (s: String) => string
export default function CreateVersionRecord(setting: ISetting | undefined) {
    const defaultConfig: Required<ISetting> = {
        name: 'VersionRecord',
        isFileAdd(name) {
            return name.includes('mian')
        },
        getString(branchName, commitId, tag, date) {
            return `${branchName}-${commitId}-${tag}-${date}`
        },
        valueKey: 'version',
        checkEnvironment: true
    }
    const { name, isFileAdd, getString, valueKey, checkEnvironment } = Object.assign(defaultConfig, setting) as Required<ISetting>
    class VersionRecord {
        @LimitEnvironment(checkEnvironment)
        apply(compiler: any) {
            compiler.hooks.compilation.tap(name, (compilation: any) => {
                compilation.hooks.optimizeChunkAssets.tap(name, (chunks: any) => {
                    let isAdd = false
                    chunks.forEach((chunk: any) => {
                        if (isAdd) {
                            return
                        }
                        chunk.files.forEach((fileName: string) => {
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
    return VersionRecord
}
function getVersionInfo(): [string, string, string, string] {
    const branchName = getBranchName()
    const commitId = getCommitID()
    const tag = getTag()
    const date = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return [branchName, commitId, tag, date]
}
// 获取当前分支名
function getBranchName(): string {
    const branchList = execSync('git branch').toString()
    const split: (s: string) => Array<string> = s => s.split('\n')
    const filter: (s: Array<string>) => string = s => s.filter(item => item.includes('*'))[0]
    const replace: IStringer = s => s.replace('* ', '')
    return flow(split, filter, replace)(branchList)
}
// 获取当前commitId
function getCommitID(): string {
    const idList = execSync('git log -1').toString()
    const split: (s: string) => Array<string> = s => s.split('\n')
    const filter: (s: Array<string>) => string = s => s.filter(item => item.includes('commit'))[0]
    const replaceStart: IStringer = s => s.replace('commit ', '')
    const replaceEnd: IStringer = s => s.replace(' .*', '')
    return flow(split, filter, replaceStart, replaceEnd)(idList)
}
// 获取tag
function getTag(): string {
    const list = execSync('git tag ').toString()
    const split: (s: string) => Array<string> = s => s.split('\n')
    const getFirst: (s: string) => string = s => get(s, 0, 'null')
    return flow(split, getFirst)(list)
}


// 
function LimitEnvironment(checkEnvironment) {
    const cancel = function (target, name, descriptor) {
        return { ...descriptor, value() { } }
    }
    if (checkEnvironment === false) {
        return cancel
    }
    if (typeof checkEnvironment === 'string' && checkEnvironment !== NODE_ENV) {
        return cancel
    }
    if (Array.isArray(checkEnvironment) && !checkEnvironment.includes(NODE_ENV)) {
        return cancel
    }
    return function (target, name, descriptor) {
        return descriptor
    }
}