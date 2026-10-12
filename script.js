(() => {
  'use strict';
  const ROWS = 17, COLS = 28;
  const $ = (id) => document.getElementById(id);
  const gridElement = $('grid'), algorithmSelect = $('algorithm'), speedSelect = $('speed');
  const visualizeBtn = $('visualizeBtn'), mazeBtn = $('mazeBtn'), clearBtn = $('clearBtn'), compareBtn = $('compareBtn');
  const comparisonPanel = $('comparisonPanel'), comparisonBody = $('comparisonBody');
  const visitedCountElement = $('visitedCount'), pathLengthElement = $('pathLength'), statusElement = $('status');
  let start = { row: 8, col: 5 }, target = { row: 8, col: 22 }, walls = new Set(), nodes = [];
  let isDrawing = false, isRunning = false, runToken = 0;
  const keyOf = (r, c) => `${r},${c}`;
  const same = (a, b) => a.row === b.row && a.col === b.col;
  const isSpecial = (r, c) => same(start, { row: r, col: c }) || same(target, { row: r, col: c });
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  function delayForSpeed() { return speedSelect.value === 'fast' ? 5 : speedSelect.value === 'slow' ? 35 : 16; }
  function buildGrid() {
    gridElement.innerHTML = ''; nodes = [];
    for (let row = 0; row < ROWS; row++) {
      const rowNodes = [];
      for (let col = 0; col < COLS; col++) {
        const node = document.createElement('div');
        node.className = 'node'; node.dataset.row = row; node.dataset.col = col;
        node.setAttribute('role', 'button'); node.tabIndex = 0;
        node.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}${same(start,{row,col}) ? ', start' : same(target,{row,col}) ? ', target' : ''}`);
        node.addEventListener('pointerdown', (event) => {
          if (isRunning) return; event.preventDefault(); isDrawing = true;
          if (!isSpecial(row, col)) { clearSearchPaint(); comparisonPanel.hidden = true; setWall(row, col, !walls.has(keyOf(row,col))); }
        });
        node.addEventListener('pointerenter', () => { if (isDrawing && !isRunning) setWall(row, col, true); });
        node.addEventListener('keydown', (event) => {
          if (isRunning || !['Enter',' '].includes(event.key)) return;
          event.preventDefault(); if (!isSpecial(row,col)) { clearSearchPaint(); setWall(row,col,!walls.has(keyOf(row,col))); }
        });
        rowNodes.push(node); gridElement.appendChild(node);
      }
      nodes.push(rowNodes);
    }
    renderGrid();
  }
  function renderGrid() {
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const node=nodes[r][c]; node.className='node';
      if (walls.has(keyOf(r,c))) node.classList.add('wall');
      if (same(start,{row:r,col:c})) node.classList.add('start');
      if (same(target,{row:r,col:c})) node.classList.add('end');
      node.setAttribute('aria-label', `Row ${r+1}, column ${c+1}${same(start,{row:r,col:c})?', start':same(target,{row:r,col:c})?', target':walls.has(keyOf(r,c))?', wall':''}`);
    }
  }
  function setWall(r,c,add) {
    if (isSpecial(r,c)) return;
    const key=keyOf(r,c); if(add) walls.add(key); else walls.delete(key);
    if(nodes[r]?.[c]) nodes[r][c].classList.toggle('wall',add);
  }
  window.addEventListener('pointerup',()=>{isDrawing=false;});
  window.addEventListener('pointercancel',()=>{isDrawing=false;});
  window.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&isRunning){runToken++;setBusy(false);clearSearchPaint();resetStats();statusElement.textContent='Visualization cancelled';statusElement.style.color='var(--pink)';}});
  function getNeighbors(node) {
    return [{row:node.row-1,col:node.col},{row:node.row,col:node.col+1},{row:node.row+1,col:node.col},{row:node.row,col:node.col-1}]
      .filter(n=>n.row>=0&&n.row<ROWS&&n.col>=0&&n.col<COLS&&!walls.has(keyOf(n.row,n.col)));
  }
  function reconstructPath(cameFrom, found) {
    if (same(start,target)) return [];
    const targetKey=keyOf(target.row,target.col), startKey=keyOf(start.row,start.col);
    if (!found || !cameFrom.has(targetKey)) return [];
    const path=[]; let current=targetKey, guard=0;
    while(current!==startKey && guard++ <= ROWS*COLS) {
      const [row,col]=current.split(',').map(Number); path.push({row,col}); current=cameFrom.get(current);
      if(!current) return [];
    }
    return current===startKey ? path.reverse() : [];
  }
  const heuristic=(a,b)=>Math.abs(a.row-b.row)+Math.abs(a.col-b.col);
  function searchBFS() {
    const queue=[start], seen=new Set([keyOf(start.row,start.col)]), cameFrom=new Map(), visited=[]; let head=0, found=same(start,target);
    while(head<queue.length){const current=queue[head++];visited.push(current);if(same(current,target)){found=true;break;}
      for(const next of getNeighbors(current)){const k=keyOf(next.row,next.col);if(seen.has(k))continue;seen.add(k);cameFrom.set(k,keyOf(current.row,current.col));queue.push(next);}}
    return {visited,path:reconstructPath(cameFrom,found),found};
  }
  function searchDFS() {
    const stack=[start], seen=new Set([keyOf(start.row,start.col)]), cameFrom=new Map(), visited=[]; let found=same(start,target);
    while(stack.length){const current=stack.pop();visited.push(current);if(same(current,target)){found=true;break;}
      for(const next of getNeighbors(current)){const k=keyOf(next.row,next.col);if(seen.has(k))continue;seen.add(k);cameFrom.set(k,keyOf(current.row,current.col));stack.push(next);}}
    return {visited,path:reconstructPath(cameFrom,found),found};
  }
  function searchWeighted(useAStar) {
    const startKey=keyOf(start.row,start.col), targetKey=keyOf(target.row,target.col);
    const open=[start], openKeys=new Set([startKey]), cameFrom=new Map(), gScore=new Map([[startKey,0]]), closed=new Set(), visited=[];
    while(open.length){let best=0;
      for(let i=1;i<open.length;i++){const ak=keyOf(open[i].row,open[i].col), bk=keyOf(open[best].row,open[best].col);
        const as=(gScore.get(ak)??Infinity)+(useAStar?heuristic(open[i],target):0), bs=(gScore.get(bk)??Infinity)+(useAStar?heuristic(open[best],target):0);if(as<bs)best=i;}
      const current=open.splice(best,1)[0], ck=keyOf(current.row,current.col);openKeys.delete(ck);if(closed.has(ck))continue;closed.add(ck);visited.push(current);
      if(ck===targetKey)break;
      for(const next of getNeighbors(current)){const nk=keyOf(next.row,next.col);if(closed.has(nk))continue;const tentative=(gScore.get(ck)??Infinity)+1;
        if(tentative<(gScore.get(nk)??Infinity)){gScore.set(nk,tentative);cameFrom.set(nk,ck);if(!openKeys.has(nk)){open.push(next);openKeys.add(nk);}}}
    }
    return {visited,path:reconstructPath(cameFrom,closed.has(targetKey)),found:closed.has(targetKey)};
  }
  function runAlgorithmByName(name){if(name==='bfs')return searchBFS();if(name==='dfs')return searchDFS();if(name==='dijkstra')return searchWeighted(false);return searchWeighted(true);}
  function clearSearchPaint(){for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)nodes[r][c].classList.remove('visited','path');}
  function setBusy(busy){isRunning=busy;[visualizeBtn,mazeBtn,clearBtn,compareBtn,algorithmSelect,speedSelect].forEach(el=>{el.disabled=busy;});gridElement.setAttribute('aria-busy',String(busy));}
  function resetStats(){visitedCountElement.textContent='—';pathLengthElement.textContent='—';statusElement.textContent='Ready to explore';statusElement.style.color='var(--cyan)';}
  function cancelRun(message='Ready to explore') {runToken++;isDrawing=false;setBusy(false);clearSearchPaint();resetStats();statusElement.textContent=message;}
  async function visualize(){if(isRunning)return;const token=++runToken;setBusy(true);comparisonPanel.hidden=true;clearSearchPaint();visitedCountElement.textContent='0';pathLengthElement.textContent='—';statusElement.textContent='Searching…';statusElement.style.color='var(--cyan)';
    try{const result=runAlgorithmByName(algorithmSelect.value), startKey=keyOf(start.row,start.col),targetKey=keyOf(target.row,target.col);let count=0;
      for(const point of result.visited){if(token!==runToken)return;const k=keyOf(point.row,point.col);if(k!==startKey&&k!==targetKey)nodes[point.row][point.col].classList.add('visited');count++;visitedCountElement.textContent=String(count);await wait(delayForSpeed());}
      for(const point of result.path){if(token!==runToken)return;const k=keyOf(point.row,point.col);if(k!==startKey&&k!==targetKey)nodes[point.row][point.col].classList.add('path');await wait(Math.max(4,delayForSpeed()));}
      if(token!==runToken)return;pathLengthElement.textContent=result.found?(same(start,target)?'0':String(result.path.length)):'—';statusElement.textContent=result.found?'Path found': 'No path exists';statusElement.style.color=result.found?'var(--green)':'var(--pink)';
    }catch(error){console.error('Pathfinding visualization failed:',error);if(token===runToken){statusElement.textContent='Error — please try again';statusElement.style.color='var(--pink)';}}
    finally{if(token===runToken)setBusy(false);}
  }
  function compareAlgorithms(){if(isRunning)return;const token=++runToken;setBusy(true);comparisonBody.innerHTML='';clearSearchPaint();
    try{for(const a of [{name:'BFS',key:'bfs'},{name:'DFS',key:'dfs'},{name:'Dijkstra',key:'dijkstra'},{name:'A*',key:'astar'}]){
      const t0=performance.now(),result=runAlgorithmByName(a.key),elapsed=performance.now()-t0,found=result.found;
      const row=document.createElement('tr');[a.name,result.visited.length.toLocaleString(),found?(same(start,target)?'0':result.path.length.toLocaleString()):'—',`${elapsed.toFixed(2)} ms`].forEach(value=>{const td=document.createElement('td');td.textContent=value;row.appendChild(td);});
      const td=document.createElement('td'),pill=document.createElement('span');pill.className=`result-pill${found?'':' no-path'}`;pill.textContent=found?'Path found':'No path';td.appendChild(pill);row.appendChild(td);comparisonBody.appendChild(row);
    }comparisonPanel.hidden=false;statusElement.textContent='Comparison complete';statusElement.style.color='var(--green)';comparisonPanel.scrollIntoView({behavior:'smooth',block:'nearest'});
    }catch(error){console.error('Algorithm comparison failed:',error);statusElement.textContent='Comparison failed — please try again';statusElement.style.color='var(--pink)';}
    finally{if(token===runToken)setBusy(false);}
  }
  function clearWalls(){if(isRunning)return;cancelRun('Walls cleared');comparisonPanel.hidden=true;walls.clear();renderGrid();}
  function generateMaze(){if(isRunning)return;cancelRun('Maze generated');comparisonPanel.hidden=true;walls.clear();
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(!isSpecial(r,c)&&Math.random()<0.25)walls.add(keyOf(r,c));
    // Guarantee a clear horizontal corridor from start to target, then a one-cell safety buffer around it.
    const left=Math.min(start.col,target.col),right=Math.max(start.col,target.col);
    for(let c=left;c<=right;c++){walls.delete(keyOf(start.row,c));if(start.row>0)walls.delete(keyOf(start.row-1,c));if(start.row<ROWS-1)walls.delete(keyOf(start.row+1,c));}
    renderGrid();resetStats();statusElement.textContent='Maze generated — corridor kept clear';
  }
  visualizeBtn.addEventListener('click',visualize);mazeBtn.addEventListener('click',generateMaze);compareBtn.addEventListener('click',compareAlgorithms);clearBtn.addEventListener('click',clearWalls);
  buildGrid();
})();
