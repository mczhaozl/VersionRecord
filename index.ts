const ConcatSource = require('webpack-sources').ConcatSource
const { flow, get } = require('lodash')
const execSync = require('child_process').execSync
const dayjs = require('dayjs')
type ISetting = {
    name?: String,
    isFileAdd?: (fileName: String) => Boolean,
    getString?: (branchName: string, commitId: String, tag: String, date: String) => String
}
type IStringer = (s: String) => string
export default function CreateVersionRecord(setting: ISetting | undefined) {
    const defaultConfig: ISetting = {
        name: 'VersionRecord',
        isFileAdd(name) {
            return name.includes('mian')
        },
        getString(branchName, commitId, tag, date) {
            return `${branchName}-${commitId}-${tag}-${date}`
        }
    }
    const { name, isFileAdd, getString } = Object.assign(defaultConfig, setting) as Required<ISetting>
    class VersionRecord {
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