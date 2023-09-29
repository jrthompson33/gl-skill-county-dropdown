import React, { useRef, useMemo, useCallback } from 'react';
import { VariableSizeList, ListChildComponentProps } from 'react-window';

import { InputBase, IconButton, Divider, Paper, MenuItem, Popover, Fade } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClearIcon from '@mui/icons-material/Clear';

import { HierarchyItem } from '../core/data';

interface DropdownListVirtualizedProps {
    items: HierarchyItem[];
    searchValue: string;
    selectedItem: HierarchyItem | undefined;
    countToShow: number;
    onItemClick: (item: HierarchyItem) => void;
}

const boldText = (str: string, substr: string) => {
    // Get segments split by substring
    const segments = str.split(new RegExp(`(${substr})`, 'gi'));
    // Bold all that are same as substring
    return segments.map(s => s.toLowerCase() === substr.toLowerCase() ? <b>{s}</b> : <span>{s}</span>);
}

const DropdownListVirtualized = (props: DropdownListVirtualizedProps) => {
    const { items, onItemClick, countToShow, searchValue, selectedItem } = props;
    const itemCount = items.length;
    const itemSize = 48;

    const renderRow = (props: ListChildComponentProps) => {
        const { data, index, style } = props;
        const item = data[index];
        const inlineStyle = {
            ...style,
        };

        let spanName = [<span>{item.name}</span>];
        if (searchValue.length > 0) {
            spanName = boldText(item.name, searchValue);
        }

        if (item.level !== 3) {
            return (
                <li key={item.id} className={`MuiMenuItem-root MuiMenuItem-gutters level-${item.level}`} role="menuitem" style={inlineStyle}>
                    {spanName}
                </li>
            );
        } else {
            return (
                <MenuItem key={index} onClick={() => onItemClick(item)} className={`level-${item.level}`} style={inlineStyle}>
                    {spanName}
                </MenuItem>
            );
        }
    }

    const getChildSize = useCallback((item: HierarchyItem) => {
        if (item.level !== 3) {
            return 36;
        }
        return itemSize;
    }, []);

    const getHeight = useCallback(() => {
        // If greater than itemsShown just use max height
        if (itemCount > countToShow) {
            return countToShow * itemSize;
        } else {
            // Else less, then compute exact height from items
            return items.map(getChildSize).reduce((a, b) => a + b, 0);
        }
    }, [countToShow, items, itemSize, getChildSize]);

    return (
        <div>
            <VariableSizeList
                itemData={items}
                height={getHeight()}
                width='460px'
                style={{ marginBlockStart: '0.5rem', marginBlockEnd: '0.5rem' }}
                innerElementType="ul"
                itemSize={(index: number) => getChildSize(items[index])}
                overscanCount={8}
                itemCount={itemCount}
            >
                {renderRow}
            </VariableSizeList>
        </div>
    );
}

export interface SearchableHierarchyListProps {
    hierarchyList: HierarchyItem[];
    handleChange?: (selected: any) => void;
}

export const SearchableHierarchyList = (props: SearchableHierarchyListProps) => {

    const { hierarchyList, handleChange } = props;
    const formRef = useRef(null);


    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    const [searchValue, setSearchValue] = React.useState<string>('');
    const [selectedItem, setSelectedItem] = React.useState<HierarchyItem | undefined>(undefined);

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setIsOpen(true);
    }, [setIsOpen]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    const handleItemClick = useCallback((item: any) => {
        setIsOpen(false);
        setSelectedItem(item);
    }, [setIsOpen, setSelectedItem]);

    const handleClear = useCallback(() => {
        setSelectedItem(undefined);
        setSearchValue('');
    }, [setSelectedItem, setSearchValue])

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        // If trying to type more, clear selection
        if (selectedItem) {
            setSelectedItem(undefined);
        }
        setSearchValue(event.target.value);
    }, [selectedItem, setSelectedItem, setSearchValue]);

    const filteredList = useMemo(() => {
        const lowerCaseSearch = searchValue.toLocaleLowerCase();
        const relativeMatches = hierarchyList.filter(item => item.name.toLocaleLowerCase().indexOf(lowerCaseSearch) > -1)
            .flatMap(m => m.relatives);

        // Search all the names
        // Then get a unique list of all the nodes that should stay in

        // Also should bold the part of the string that is being searched in each

        return hierarchyList.filter(item => relativeMatches.indexOf(item.id) > -1);
    }, [hierarchyList, searchValue]);

    return (
        <div>
            <Paper
                sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 500, margin: 'auto' }}
                ref={formRef}
            >
                <InputBase
                    sx={{ flex: 1 }}
                    placeholder='Please select a county'
                    inputProps={{ 'aria-label': 'please select a country' }}
                    onClick={handleClick}
                    aria-owns="fade-menu"
                    aria-haspopup="true"
                    value={selectedItem ? selectedItem.name : searchValue}
                    onChange={handleSearchChange}
                />
                {
                    selectedItem ?
                        (<IconButton onClick={handleClear} className='btn-clear' type="button" sx={{ p: '10px' }} aria-label="clear">
                            <ClearIcon />
                        </IconButton>) : undefined
                }
                <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                <IconButton onClick={handleClick} className={`btn-arrow-dropdown ${isOpen ? 'open' : ''}`} type="button" sx={{ p: '10px' }} aria-label="search">
                    <ArrowDropDownIcon />
                </IconButton>
            </Paper>
            <Popover
                id="fade-menu"
                disableAutoFocus={true}
                disableEnforceFocus={true}
                anchorEl={formRef.current}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={isOpen}
                onClose={handleClose}
                TransitionComponent={Fade}
            >
                <DropdownListVirtualized
                    onItemClick={handleItemClick}
                    items={filteredList}
                    countToShow={15}
                    searchValue={searchValue}
                    selectedItem={selectedItem}
                />
            </Popover>
        </div>
    )
}