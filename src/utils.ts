import * as crypto from 'crypto';
import { VM } from 'vm2';
export function md5(str) {
  const hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}

export function getType(variable) {
  if (variable === null) return 'null';
  if (Array.isArray(variable)) return 'array';
  return typeof variable;
}

export function delay(s: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), s * 1000));
}
// 提取字符串中的 @LMFunc 注解内容
function extractLMFunc(mockRule) {
  const results = [];
  const regex = /@LMFunc\(\s*/g; // 匹配 @LMFunc( 开头

  let match;
  while ((match = regex.exec(mockRule)) !== null) {
    const startIndex = match.index; // 找到开头位置
    let stack = 1; // 初始化栈，表示找到的 '(' 数量
    let endIndex = startIndex + match[0].length; // 从开头继续查找

    while (endIndex < mockRule.length && stack > 0) {
      if (mockRule[endIndex] === '(') {
        stack++; // 遇到 '(' 栈加一
      } else if (mockRule[endIndex] === ')') {
        stack--; // 遇到 ')' 栈减一
      }
      endIndex++;
    }

    if (stack === 0) {
      // 如果栈为零，说明括号是闭合的
      results.push(mockRule.slice(startIndex, endIndex)); // 提取完整的 @LMFunc() 内容
    }
  }

  return results;
}

// 处理mockRule函数部分
export function handleMockRuleFuncPart(mockRule: string, sandbox) {
  const results = extractLMFunc(mockRule); // 提取 @LMFunc() 调用
  if (results.length === 0) return mockRule;

  let modifiedRule = mockRule;

  const vm = new VM({
    timeout: 1000, // 设置超时为1秒
    sandbox,
  });

  // 遍历每个函数调用并直接替换
  results.forEach((funcCall) => {
    let returnValue; // 处理函数调用
    try {
      let code = `
      (function() {
      `;
      funcCall
        .slice(8, -1)
        .trim()
        .split('\\n')
        .forEach((item) => {
          code += `
        ${item.trim()}

        `;
        });
      code += `
       })()
      `;

      returnValue = vm.run(code);
      returnValue = JSON.stringify(returnValue);
    } catch (error) {
      returnValue = `"LMFunc execution error"`; // 或者根据需要返回其他值
    }

    const regex = new RegExp(
      `"${funcCall}"`.replace(/([.*+?^${}()|\[\]\\])/g, '\\$1'),
      'g',
    );
    modifiedRule = modifiedRule.replace(regex, returnValue); // 替换原始字符串
  });

  return modifiedRule;
}
