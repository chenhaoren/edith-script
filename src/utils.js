/* eslint-disable no-undef */
import { measureBWSimple } from './api'

const performance = window.performance
/**
 * 参数格式化, 符合url方式
 * @params {Object} {a: '123', age: '18'}
 * @return {String} 'a=123&age=18'
 */
export const stringifyParams = (params, cb) => {
  let name
  let value
  let str = ''

  for (name in params) {
    value = params[name]
    str += name + '=' + (
      typeof cb === 'function' ?
        cb(value, name) :
        value && typeof value === 'object' && !Object.getPrototypeOf(value).slice ? JSON.stringify(value) : value ) + '&'
  }

  return str.slice(0, -1)
}

//获取元素的tagName, 兼容极低版本的问题
export const getTagName = el => {
  if(!el) return ''
  if(el === document) return 'html'
  if(el.tagName) return el.tagName
  return el.outerHTML.match(/<([^>\s]+)/)[1]
}
// 获取ua环境信息
export const uaInfo = (() => {
  const uaInfo = navigator.userAgent.match(/[^(\s]+(\s\([^)]+\))?/g)
  return uaInfo
})()

// 测网速,返回单位为KB/sec的数值
// https://juejin.im/post/5b4de6b7e51d45190d55340b
export const testNetworkSpeed = () => {
  const n = navigator
  const c = 'connection'
  const d = 'downlink'
  if(n[c] && n[c][d]){ // 在 Chrome65+ 的版本中，有原生的方法
    return n[c][d] * 1024 /8;   //单位为KB/sec
  }
}

// 获取网络类型
// https://juejin.im/post/5b4de6b7e51d45190d55340b
export const getNetworkType = () => {
  const n = navigator
  const c = 'connection'
  const e = 'effectiveType'
  if(n[c] && n[c][e]){ // 在 Chrome65+ 的版本中，有原生的方法
    return n[c][e]   //单位为KB/sec
  }
  return ''
}
// 通过发起http请求，测试网络速度, 定时调用回调，参数为单位为KB/sec的数值
export const measureBW = (fn, time) => {
  const test = n => {
    const startTime = getCurrentTime();
    measureBWSimple({ t : Math.random() }).then(res => {
      const fileSize = res.length
      const endTime = getCurrentTime();
      var speed = fileSize / ((endTime - startTime)/1000) / 1024;
      fn && n && fn(Math.floor(speed));
      if(n >= time) return
      test(++n)
    }).catch(e => {}) 
  }
  test(0)
}
// 事件阻止
export const eventPresent = e => {
  if(!e) return
  const func = ['preventDefault', 'stopPropagation']
  func.forEach(item => e[item] && e[item]())
  e.cancelBubble = true
}

// 获取延迟,通过js加载一张1x1的极小图片，来测试图片加载的所用的时长
export const measureDelay = (fn, count) => {
  count = count || 1
  let n = 0, timeid
  const src = 'https://hm.baidu.com/hm.gif?'
  const ld = () => {
      const t = getCurrentTime(), img = new Image;
      img.onload = () => {
          const tcp = getCurrentTime() - t
          n++
          fn(tcp) // 存储延迟回调
          if(n < count) timeid = setTimeout(ld, 1000);
      }
      img.src = src + Math.random();
      img.onerror = tryCatchFunc(eventPresent)
  };
  const img_start = new Image();
  img_start.onerror = tryCatchFunc(eventPresent)
  img_start.onload = ld
  img_start.src = src + Math.random();
}


/**
  * 把数据保存到本地
  */
export const saveLocalData = (key, item, isSession) => {
  const storage = isSession ? sessionStorage : localStorage
  try {
    if (item === void 0) storage.removeItem(key)
    else storage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.warn(error)
  }
}
/**
  * 读取本地数据
  */
export const getLocalData = (key, isSession) => {
  let res = null
  try {
    if (key === void 0) {
      let allName = Object.keys(isSession ? sessionStorage : localStorage)
      if (allName.length > 0) {
        res = {}
        allName.forEach(keyName => {
          res[keyName] = getLocalData(keyName)
        })
      }
    } else res = JSON.parse((isSession ? sessionStorage : localStorage).getItem(key))
  } catch (error) {
    console.warn(error)
  }
  return res
}

// 对方法进行封装，防止内部报错
export const tryCatchFunc = fn => function (...args) {
  try {
    return fn.apply(this, args)
  } catch (error) {
    console.warn('edith 内部报错', error)
  }
}

// 通用事件监听方法
export const edithAddEventListener = (name, fn, useCapture) => {
  if (addEventListener) { // 所有主流浏览器，除了 IE 8 及更早版本
    addEventListener(name, tryCatchFunc(fn), useCapture);
  } else if (attachEvent) { // IE 8 及更早版本
    attachEvent(`on${name}`, tryCatchFunc(fn));
  }
}

// 生成随机ID
export const getRandomID = () => {
  return ('' + getCurrentTime() * Math.random()).slice(0, 8)
}

// 获取Dom的xpath
export const getXPath = element => {
  const { parentNode } = element
  if(parentNode === document) return `/html`
  const tagName = getTagName(element).toLowerCase()
  if (element === document.body) return `/html/${tagName}`
  let ix = 0;
  const siblings = parentNode.childNodes;
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element)
      return `${getXPath(parentNode)}/${tagName}[${(ix + 1)}]`
    if (sibling.nodeType === 1 && sibling.tagName === tagName) ix++;
  }
}

export const isIE8 = (() => {
  var ua = navigator.userAgent.toLowerCase();

  var isIE = ua.indexOf('msie') > -1;

  var safariVersion = isIE ? ua.match(/msie ([\d.]+)/)[1] : 100
  return safariVersion <= 8
})()

// 执行环境监测以及性能
export const getPerform = () => { 
  // const getEntriesByType = 'getEntriesByType'
  if(!performance) {
    // console.warn('edith 内部报错: 当前环境不支持性能监控', )
    return false
  }
  return {
    timing: performance.timing,
    // chromeLoadingTiming: chrome && chrome.loadTimes(),
    // entriesTiming: {
    //   navigation: per[getEntriesByType]('navigation'),
    //   paint: per[getEntriesByType]('paint'),
    //   resource: per[getEntriesByType]('resource').filter(item => !item.name.match(/hm\.baidu\.com\/hm\.gif/)),
    // },
  }
}
// Dom的outerHTML，超过200字符，中间用省略号代替
export const getOuterHTML = errorTarget => {
  let outerHTML = errorTarget.outerHTML;
  // 如果点击的内容过长，就截取上传
  if (outerHTML.length > 200) outerHTML = outerHTML.substr(0, 100) + '... ...' + outerHTML.substr(-99);
  return outerHTML
}
// 获取当前时间戳
export const getCurrentTime = () => (new Date()).getTime()

// 判断是否是成功的请求状态码,不包含跨域，超时等请求
export const isSuccess = status => status < 400

// 转换成字符串，除了函数
export const transToString = p => p && typeof p === 'object' ? JSON.stringify(p) : (p + '')

export const getAarege = arr => { 
  const total = arr.reduce((total, item) => total + item, 0)
  return arr.length === 0 ? -1 : total / arr.length
}
// 异步加载scripts标签
export const loadScript = (url, cb, reject = () => {}) => {
  const script = document.createElement('script')
  script.src = url
  script.onload = cb
  script.onerror = reject
  document.getElementsByTagName('head')[0].appendChild(script); 
  // document.head.appendChild(script)
} 
// 异步加载插件，封装成promise
export const loadCdnScript = (url, name) => new Promise((resolve, reject) => {
  loadScript(url, () => resolve({ default: window.Edith[name] }), reject)
})
const removeHttpAndQuery = url => url.replace(/^[^/]*:?\/\//, '').split('?')[0]
// 判断是不是在白名单
export const isWhite = (list, url) => {
  return list.find(i => {
    if(i instanceof RegExp) return i.test(url)
    if (typeof i !== 'string') return
    return removeHttpAndQuery(i) === removeHttpAndQuery(url)
  })
}
// 避免map方法进入reject
export const getPromiseResult = promises => {
  const handlePromise = Promise.all(
    promises.map(fn => fn.catch ? fn.catch(err => 0) : fn)
  )
  return handlePromise
}
// 页面打开的时间
export const startTiming = (performance.timing && performance.timing.navigationStart) || getCurrentTime()

// 获取当前相对于页面打开时的时间戳
export const getTimeStamp = () => getCurrentTime() - startTiming

export const isFunction = fn => typeof fn === 'function'

// 得到Headers对象里的数据
export const getHeaders = h => {
  const header = {}
  if(h instanceof Headers) {
    for(var p of headers) {
      header[p[0]] = p[1]
    }
    return header
  }
  return h
}