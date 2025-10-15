const display = document.getElementById('display');
const keys = document.querySelector('.keys');
let expr = '';
let lastAns = '';

function updateDisplay(){
  display.textContent = expr || '0';
}

function isOperator(ch){
  return ['+','-','*','/','%','^'].includes(ch);
}


function tokenize(s){
  const tokens = [];
  let i = 0;
  while(i < s.length){
    const ch = s[i];
    if(/\s/.test(ch)){ i++; continue; }

    if(/[0-9.]/.test(ch)){
      let num = ch; i++;
      while(i<s.length && /[0-9.]/.test(s[i])){ num += s[i++]; }
      tokens.push(num);
      continue;
    }

    if(/[a-zA-Z]/.test(ch)){
      let name = ch; i++;
      while(i<s.length && /[a-zA-Z]/.test(s[i])) name += s[i++];
      tokens.push(name);
      continue;
    }

    if(isOperator(ch) || ch === '(' || ch === ')'){
      tokens.push(ch);
      i++;
      continue;
    }

    i++;
  }
  return tokens;
}

const prec = {'+':1,'-':1,'*':2,'/':2,'%':2,'^':3};
const rightAssoc = {'^': true};

const functionsSet = new Set(['sin','cos','tan','sqrt','ln','log','pow']);

function toRPN(tokens){
  const out = [];
  const ops = [];
  for(const t of tokens){
    if(!isNaN(t)){
      out.push(t);
    } else if(functionsSet.has(t.toLowerCase())){
      ops.push(t.toLowerCase());
    } else if(isOperator(t)){
      while(ops.length){
        const top = ops[ops.length-1];
        if(isOperator(top) && ((rightAssoc[t] && prec[t] < prec[top]) || (!rightAssoc[t] && prec[t] <= prec[top]))){
          out.push(ops.pop());
          continue;
        }
        break;
      }
      ops.push(t);
    } else if(t === '('){
      ops.push(t);
    } else if(t === ')'){
      while(ops.length && ops[ops.length-1] !== '(') out.push(ops.pop());
      ops.pop();
      if(ops.length && functionsSet.has(ops[ops.length-1])) out.push(ops.pop());
    } else if(t.toLowerCase() === 'pi' || t.toLowerCase() === 'e'){
      out.push(t.toLowerCase());
    } else {
      ops.push(t.toLowerCase());
    }
  }
  while(ops.length) out.push(ops.pop());
  return out;
}

function evalRPN(rpn){
  const st = [];
  for(const t of rpn){
    if(!isNaN(t)) st.push(parseFloat(t));
    else if(t === 'pi') st.push(Math.PI);
    else if(t === 'e') st.push(Math.E);
    else if(isOperator(t)){
      const b = st.pop();
      const a = st.pop();
      let res = 0;
      switch(t){
        case '+': res = a+b; break;
        case '-': res = a-b; break;
        case '*': res = a*b; break;
        case '/': res = a/b; break;
        case '%': res = a % b; break;
        case '^': res = Math.pow(a,b); break;
      }
      st.push(res);
    } else {
      const name = t.toLowerCase();
      if(name === 'sin') st.push(Math.sin(st.pop()));
      else if(name === 'cos') st.push(Math.cos(st.pop()));
      else if(name === 'tan') st.push(Math.tan(st.pop()));
      else if(name === 'sqrt') st.push(Math.sqrt(st.pop()));
      else if(name === 'ln') st.push(Math.log(st.pop()));
      else if(name === 'log') st.push(Math.log10 ? Math.log10(st.pop()) : Math.log(st.pop())/Math.LN10);
      else if(name === 'pow'){
        const b = st.pop(); const a = st.pop(); st.push(Math.pow(a,b));
      } else {
        throw new Error('Función desconocida: ' + t);
      }
    }
  }
  return st.pop();
}

function safeEvaluate(expression){
  const normalized = expression.replace(/[×xX]/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
  if(!/^[0-9+\-*/%^().eEpina-zA-Z, ]+$/.test(normalized)) return 'Error';
  try{
    const tokens = tokenize(normalized);
    const rpn = toRPN(tokens);
    const result = evalRPN(rpn);
    if(!isFinite(result)) return 'Error';
    lastAns = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(12)).toString();
    return lastAns;
  }catch(e){
    return 'Error';
  }
}

keys.addEventListener('click', e=>{
  const target = e.target;
  if(!target.matches('button')) return;
  const val = target.dataset.value;
  const action = target.dataset.action;
  if(action === 'clear'){
    expr = '';
    updateDisplay();
    return;
  }
  if(action === 'back'){
    expr = expr.slice(0,-1);
    updateDisplay();
    return;
  }
  if(action === 'ans'){
    expr += lastAns || '0';
    updateDisplay();
    return;
  }
  if(action === 'equals'){
    if(!expr) return;
    const res = safeEvaluate(expr);
    expr = res.toString();
    updateDisplay();
    return;
  }

  if(val){
    if(val === '.'){
      const tokens = expr.split(/[^0-9.]/);
      const lastNum = tokens[tokens.length - 1];
      if(lastNum.includes('.')) return;
      if(expr === '' || /[+\-*/^()]+$/.test(expr)) expr += '0';
    }
    expr += val;
    updateDisplay();
  }
});

window.addEventListener('keydown', e=>{
  const key = e.key;
  if((/^[0-9]$/.test(key)) || key === '.'){
    document.querySelector(`button[data-value="${key}"]`)?.click();
    return;
  }
  if(key === 'Enter' || key === '='){
    e.preventDefault();
    document.querySelector('button[data-action="equals"]').click();
    return;
  }
  if(key === 'Backspace'){
    document.querySelector('button[data-action="back"]').click();
    return;
  }
  if(key === 'Escape'){
    document.querySelector('button[data-action="clear"]').click();
    return;
  }
  if(['+','-','*','/','^'].includes(key)){
    document.querySelector(`button[data-value="${key}"]`)?.click();
    return;
  }
  const map = {'p':'pi','s':'sin','c':'cos','t':'tan','l':'ln'};
  if(map[key]){
    const btn = document.querySelector(`button[data-value="${map[key]}"]`);
    if(btn) btn.click();
  }
});

updateDisplay();