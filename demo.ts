
/**
 * author ： mczhaozl
 * time ： 2023年3月3日 18:44:31
 * phone ： 17746614804
 * email ： 17746614804@163.com
 */
type ISetting = {
    // 作用于webpack事件回调，一般可以不填写
    name?: String,
    // 在哪个文件里面添加代码 推荐vue在 mian.js 中添加  react 在runtime.js 中添加
    // 如果不清楚可以重新打包一下看一下打包js 文件
    isFileAdd?: (fileName: String) => Boolean,
    // window 的哪一个key 记录属性值
    valueKey?: String,
    // window[valueKey] = getString()
    getString?: (branchName: string, commitId: String, tag: String, date: String) => String
}
const config: ISetting | undefined = {
    getString(branchName: string, commitId: String, tag: String, date: String){
        return `branchName:${branchName},commitId:${commitId}`
    }
}
const CreateCheckFragment = require('CreateCheckFragment')
const CheckFragment = CreateCheckFragment(config)
module.exports = CheckFragment
// 在 webpack.config.js 中使用 new CheckFragment() 即可
