(() => {
  'use strict';
  const $ = id => document.getElementById(id), barsElement=$('sortBars'); if(!barsElement)return;
  const algorithmSelect=$('sortAlgorithm'),speedSelect=$('sortSpeed'),newArrayBtn=$('newArrayBtn'),sortBtn=$('sortBtn'),sortStatus=$('sortStatus');
  const comparisonCount=$('comparisonCount'),writeCount=$('writeCount'),arraySize=$('arraySize');
  const profileEls={title:$('complexityTitle'),description:$('complexityDescription'),best:$('bestTime'),average:$('averageTime'),worst:$('worstTime'),space:$('spaceTime'),stable:$('stableProperty'),inPlace:$('inPlaceProperty')};
  const ARRAY_SIZE=24;
  const profiles={
    bubble:{title:'Bubble Sort',description:'Repeatedly compares adjacent values and swaps out-of-order pairs. An early-exit check makes already sorted arrays linear.',best:'O(n)',average:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'Yes',inPlace:'Yes'},
    selection:{title:'Selection Sort',description:'Finds the smallest remaining value and swaps it into place. It performs few swaps but always scans the remaining unsorted section.',best:'O(n²)',average:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'No',inPlace:'Yes'},
    insertion:{title:'Insertion Sort',description:'Builds a sorted prefix by shifting larger values right. It works well for small or nearly sorted arrays.',best:'O(n)',average:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'Yes',inPlace:'Yes'},
    merge:{title:'Merge Sort',description:'Recursively sorts halves and merges them. Its predictable O(n log n) runtime suits larger datasets, using extra memory for merging.',best:'O(n log n)',average:'O(n log n)',worst:'O(n log n)',space:'O(n)',stable:'Yes',inPlace:'No'}
  };
  let values=[],busy=false,runToken=0,comparisons=0,writes=0,steps=[];
  function updateCounters(){comparisonCount.textContent=comparisons.toLocaleString();writeCount.textContent=writes.toLocaleString();arraySize.textContent=values.length;}
  function updateProfile(){const p=profiles[algorithmSelect.value];Object.entries(profileEls).forEach(([key,el])=>{if(el)el.textContent=p[key];});}
  function renderBars(active=[],sorted=[]){const activeSet=new Set(active),sortedSet=new Set(sorted),max=Math.max(1,...values);const fragment=document.createDocumentFragment();
    values.forEach((value,index)=>{const bar=document.createElement('div');bar.className='sort-bar';if(sortedSet.has(index))bar.classList.add('sorted');if(activeSet.has(index))bar.classList.add('active');bar.style.height=`${(value/max)*96}%`;bar.title=`Index ${index}: ${value}`;bar.setAttribute('aria-label',`Index ${index}, value ${value}`);fragment.appendChild(bar);});barsElement.replaceChildren(fragment);}
  function record(active=[],sorted=[]){steps.push({values:values.slice(),active,sorted,comparisons,writes});}
  function bubbleSort(){const n=values.length,sorted=new Set();for(let i=0;i<n;i++){let swapped=false;for(let j=0;j<n-i-1;j++){comparisons++;record([j,j+1],[...sorted]);if(values[j]>values[j+1]){[values[j],values[j+1]]=[values[j+1],values[j]];writes+=2;swapped=true;record([j,j+1],[...sorted]);}}sorted.add(n-i-1);record([],[...sorted]);if(!swapped){for(let k=0;k<n-i-1;k++)sorted.add(k);record([],[...sorted]);break;}}}
  function selectionSort(){const n=values.length,sorted=new Set();for(let i=0;i<n-1;i++){let min=i;for(let j=i+1;j<n;j++){comparisons++;record([min,j],[...sorted]);if(values[j]<values[min])min=j;}if(min!==i){[values[i],values[min]]=[values[min],values[i]];writes+=2;record([i,min],[...sorted]);}sorted.add(i);record([],[...sorted]);}if(n)sorted.add(n-1);record([],[...sorted]);}
  function insertionSort(){const sorted=new Set();for(let i=0;i<values.length;i++){const current=values[i];let j=i-1;while(j>=0){comparisons++;record([j,i],[...sorted]);if(values[j]<=current)break;values[j+1]=values[j];writes++;record([j,j+1],[...sorted]);j--;}values[j+1]=current;writes++;for(let k=0;k<=i;k++)sorted.add(k);record([j+1],[...sorted]);}}
  function mergeSort(){function merge(left,mid,right){const L=values.slice(left,mid+1),R=values.slice(mid+1,right+1);let i=0,j=0,k=left;while(i<L.length&&j<R.length){comparisons++;record([k,left+i,mid+1+j],[]);values[k++]=L[i]<=R[j]?L[i++]:R[j++];writes++;record([k-1],[]);}while(i<L.length){values[k++]=L[i++];writes++;record([k-1],[]);}while(j<R.length){values[k++]=R[j++];writes++;record([k-1],[]);}}function split(l,r){if(l>=r)return;const m=Math.floor((l+r)/2);split(l,m);split(m+1,r);merge(l,m,r);}split(0,values.length-1);record([],values.map((_,i)=>i));}
  function createArray(){if(busy)return;runToken++;values=Array.from({length:ARRAY_SIZE},()=>Math.floor(Math.random()*90)+10);comparisons=0;writes=0;steps=[];renderBars();updateCounters();sortStatus.textContent='New array ready';sortStatus.style.color='var(--cyan)';}
  function setBusy(value){busy=value;[sortBtn,newArrayBtn,algorithmSelect,speedSelect].forEach(el=>el.disabled=value);barsElement.setAttribute('aria-busy',String(value));}
  function delay(){return speedSelect.value==='fast'?12:speedSelect.value==='slow'?90:32;}
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function runSort(){if(busy)return;const token=++runToken;setBusy(true);comparisons=0;writes=0;steps=[];const initial=values.slice(),algorithm=algorithmSelect.value;
    try{sortStatus.textContent='Preparing animation…';sortStatus.style.color='var(--cyan)';if(algorithm==='bubble')bubbleSort();else if(algorithm==='selection')selectionSort();else if(algorithm==='insertion')insertionSort();else mergeSort();
      const finalValues=values.slice(),finalComparisons=comparisons,finalWrites=writes;values=initial;comparisons=0;writes=0;renderBars();updateCounters();sortStatus.textContent=`Animating ${profiles[algorithm].title}…`;
      // Keep the pedagogically meaningful states, but render at a capped cadence to avoid excessive DOM churn.
      const stride= speedSelect.value==='fast' ? Math.max(1,Math.ceil(steps.length/240)) : 1;
      for(let i=0;i<steps.length;i+=stride){if(token!==runToken)return;const step=steps[i];values=step.values;comparisons=step.comparisons;writes=step.writes;renderBars(step.active,step.sorted);updateCounters();await wait(delay());}
      if(token!==runToken)return;values=finalValues;comparisons=finalComparisons;writes=finalWrites;renderBars([],values.map((_,i)=>i));updateCounters();sortStatus.textContent='Array sorted ✓';sortStatus.style.color='var(--green)';
    }catch(error){console.error('Sorting animation failed:',error);if(token===runToken){sortStatus.textContent='Sorting failed — generate a new array and retry';sortStatus.style.color='var(--pink)';}}
    finally{if(token===runToken)setBusy(false);}
  }
  window.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&busy){runToken++;setBusy(false);sortStatus.textContent='Sorting cancelled';sortStatus.style.color='var(--pink)';}});
  algorithmSelect.addEventListener('change',updateProfile);newArrayBtn.addEventListener('click',createArray);sortBtn.addEventListener('click',runSort);createArray();updateProfile();
})();
