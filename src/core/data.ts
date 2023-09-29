export interface CensusEntity {
    name: string;
    id: number;
    level: 'region' | 'state' | 'county';
    parent: number;
}

export interface HierarchyItem {
    level: number;
    name: string;
    id: number;
    relatives: number[];
}