import React, { useEffect, useState } from 'react';
import './App.css';
import { SearchableHierarchyList } from './views/SearchableHierarchyList';
import { CensusEntity, HierarchyItem } from './core/data';

const handleFileFetched = (response: Response) => {
  console.log(response)
  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}`);
  }
  return response.json();
}

const CENSUS_LEVEL_MAP = {
  region: 1,
  state: 2,
  county: 3,
}

const App = () => {

  const [hierarchyFlatList, setHierarchyFlatList] = useState<HierarchyItem[]>([]);

  useEffect(() => {
    // Load the data here
    fetch('https://gist.githubusercontent.com/bleonard33/38a183289ed87082fed7b2547f2eea49/raw/d307b85bbc69a32902307e4027d51513686ea147/census_classification.json')
      .then(handleFileFetched)
      .then((json: any) => {
        console.log(json);
        // Make sure json is ordered by level so easier to create tree
        json.sort((a: CensusEntity, b: CensusEntity) => {
          return CENSUS_LEVEL_MAP[a.level] - CENSUS_LEVEL_MAP[b.level];
        })


        // Create tree structure using rootmap, keep track of entities based on id with entityMap
        const entityMap = new Map<number, CensusEntity>();
        const rootMap = new Map();
        // TODO if had more time would make this recursive
        json.forEach((d: CensusEntity) => {
          entityMap.set(d.id, d);
          if (CENSUS_LEVEL_MAP[d.level] === 1) {
            rootMap.set(d.id, { id: d.id, parents: [], children: new Map() });
          } else if (CENSUS_LEVEL_MAP[d.level] === 2) {
            // Get top level parent
            let p = entityMap.get(d.parent);
            let np = p ? rootMap.get(p.id): undefined;
            if (np.children.has(d.id)) {
              console.error('Duplicate ID at level 2');
            } else {
              np.children.set(d.id, { id: d.id, parents: [np.id], children: new Map() })
            }
          } else {
            // Get top level parent
            let p = entityMap.get(d.parent);
            let tp = p ? entityMap.get(p.parent): undefined;
            let ntp = tp ? rootMap.get(tp.id) : undefined;
            let np = p ? ntp.children.get(p.id) : undefined;
            if (np.children.has(d.id)) {
              console.error('Duplicate ID at level 3');
            } else {
              np.children.set(d.id, { id: d.id, parents: [...np.parents, np.id], children: new Map() })
            }
          }
        });

        const allRelatives = new Map<number, number[]>();

        // TODO if had more time would make this recursive
        // For top levels need list of all descendent relatives
        Array.from(rootMap.values()).forEach(r => {
          allRelatives.set(r.id, [r.id]);
          const regionChildren = Array.from(r.children.values()) as any[];
          for (let i = 0; i < regionChildren.length; i++) {
            const stateChild = regionChildren[i];
            allRelatives.set(stateChild.id, [r.id, stateChild.id]);
            allRelatives.get(r.id)?.push(stateChild.id);
            const stateChildren = Array.from(stateChild.children.values()) as any[];
            for(let j = 0; j < stateChildren.length; j++) {
              const countyChild = stateChildren[j];
              allRelatives.set(countyChild.id, [r.id, stateChild.id, countyChild.id]);
              allRelatives.get(r.id)?.push(countyChild.id);
              allRelatives.get(stateChild.id)?.push(countyChild.id)
            }
          }
        });

        const hfl = Array.from(allRelatives.entries()).map((entry: [number, number[]]) => {
          const [id, relatives] = entry;
          const e = entityMap.get(id);
          if (e) {
            return { level: CENSUS_LEVEL_MAP[e.level], name: e.name, id, relatives }
          } else {
            console.error('Could not find entity in ordered', id);
            return { level: -1, name: '', id: -1, relatives: [] }
          }
        });

        // Set the list, this will update UI
        setHierarchyFlatList(hfl);
      }).catch((reason) => {
        console.error(reason);
      });
  }, [])

  return (
    <div className="App">
      <SearchableHierarchyList hierarchyList={hierarchyFlatList} />
    </div>
  );
}

export default App;
