/**
 * Copyright Schrodinger, LLC
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableBufferedRows
 * @typechecks
 */

import FixedDataTableRow from 'FixedDataTableRow';
import FixedDataTableRow2 from 'FixedDataTableRow2';
import FixedDataTableTranslateDOMPosition from 'FixedDataTableTranslateDOMPosition';
import PropTypes from 'prop-types';
import React from 'react';
import cx from 'cx';
import emptyFunction from 'emptyFunction';
import joinClasses from 'joinClasses';
import inRange from 'lodash/inRange';

class FixedDataTableBufferedRows extends React.Component {
  static propTypes = {
    allowColumnVirtualization: PropTypes.bool,
    isScrolling: PropTypes.bool,
    firstViewportRowIndex: PropTypes.number.isRequired,
    endViewportRowIndex: PropTypes.number.isRequired,
    columnsToRender: PropTypes.array.isRequired,
    fixedColumns: PropTypes.array.isRequired,
    fixedRightColumns: PropTypes.array.isRequired,
    columnOffsets: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    offsetTop: PropTypes.number.isRequired,
    onRowClick: PropTypes.func,
    onRowContextMenu: PropTypes.func,
    onRowDoubleClick: PropTypes.func,
    onRowMouseDown: PropTypes.func,
    onRowMouseUp: PropTypes.func,
    onRowMouseEnter: PropTypes.func,
    onRowMouseLeave: PropTypes.func,
    onRowTouchStart: PropTypes.func,
    onRowTouchEnd: PropTypes.func,
    onRowTouchMove: PropTypes.func,
    rowClassNameGetter: PropTypes.func,
    rowExpanded: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.func,
    ]),
    rowOffsets: PropTypes.object.isRequired,
    rowKeyGetter: PropTypes.func,
    rowSettings: PropTypes.shape({
      rowHeightGetter: PropTypes.func,
      rowsCount: PropTypes.number.isRequired,
      subRowHeightGetter: PropTypes.func,
    }),
    rowsToRender: PropTypes.array.isRequired,
    scrollLeft: PropTypes.number.isRequired,
    scrollTop: PropTypes.number.isRequired,
    scrollableColumns: PropTypes.array.isRequired,
    showLastRowBorder: PropTypes.bool,
    showScrollbarY: PropTypes.bool,
    width: PropTypes.number.isRequired,
  }

  componentWillMount() {
    this._staticRowArray = [];
    this._initialRender = true;
  }

  componentDidMount() {
    this._initialRender = false;
  }

  shouldComponentUpdate() /*boolean*/ {
    // Don't add PureRenderMixin to this component please.
    return true;
  }

  componentWillUnmount() {
    this._staticRowArray.length = 0;
  }

  render() /*object*/{
    this._staticRowArray = this._computeVirtualizedRows();

    return (
      <div style={this._getStyle()}>
        {this._staticRowArray}
      </div>
    );
  }

  _getStyle() {
    const {
      offsetLeft,
      offsetTop,
      scrollLeft,
      scrollTop,
    } = this.props;

    return FixedDataTableTranslateDOMPosition({}, offsetLeft - scrollLeft, offsetTop - scrollTop, false);
  }

  _computeVirtualizedRows() {
    let { isScrolling, rowsToRender } = this.props;
    rowsToRender = rowsToRender || [];
    let virtualizedRows = [];

    if (isScrolling) {
      // allow static array to grow while scrolling
      virtualizedRows.length = Math.max(this._staticRowArray.length, rowsToRender.length);
    } else {
      // when scrolling is done, static array can shrink to fit the buffer
      virtualizedRows.length = rowsToRender.length;
    }

    // render each row from the buffer into the static row array
    for (let i = 0; i < virtualizedRows.length; i++) {
      let rowIndex = rowsToRender[i];

      // if the row doesn't exist in the buffer set, then take the previous one
      if (rowIndex === undefined) {
        rowIndex = this._staticRowArray[i] && this._staticRowArray[i].props.index;
      }

      virtualizedRows[i] = this._renderRow(
        rowIndex,
        i
      );
    }

    return virtualizedRows;
  }

  /**
   * @param {number} rowIndex
   * @param {number} key
   * @return {!Object}
   */
  _renderRow(rowIndex, key) /*object*/ {
    const props = this.props;
    const rowClassNameGetter = props.rowClassNameGetter || emptyFunction;
    const fake = rowIndex === undefined;
    let rowProps = {};

    // if row exists, then calculate row specific props
    if (!fake) {
      rowProps.height = this.props.rowSettings.rowHeightGetter(rowIndex);
      rowProps.subRowHeight = this.props.rowSettings.subRowHeightGetter(rowIndex);
      rowProps.offsetTop = props.rowOffsets[rowIndex];
      rowProps.key = props.rowKeyGetter ? props.rowKeyGetter(rowIndex) : key;

      const hasBottomBorder = (rowIndex === props.rowSettings.rowsCount - 1) && props.showLastRowBorder;
      rowProps.className = joinClasses(
        rowClassNameGetter(rowIndex),
        cx('public/fixedDataTable/bodyRow'),
        cx({
          'fixedDataTableLayout/hasBottomBorder': hasBottomBorder,
          'public/fixedDataTable/hasBottomBorder': hasBottomBorder,
        })
      );
    }

    const visible = inRange(rowIndex, this.props.firstViewportRowIndex, this.props.endViewportRowIndex);

    return (
      <FixedDataTableRow2
        key={key}
        index={rowIndex}
        isScrolling={props.isScrolling}
        width={props.width}
        rowExpanded={props.rowExpanded}
        scrollLeft={Math.round(props.scrollLeft)}
        columnsToRender={props.columnsToRender}
        columnOffsets={props.columnOffsets}
        fixedColumns={props.fixedColumns}
        fixedRightColumns={props.fixedRightColumns}
        scrollableColumns={props.scrollableColumns}
        scrollContentWidth={props.scrollContentWidth}
        onClick={props.onRowClick}
        onContextMenu={props.onRowContextMenu}
        onDoubleClick={props.onRowDoubleClick}
        onMouseDown={props.onRowMouseDown}
        onMouseUp={props.onRowMouseUp}
        onMouseEnter={props.onRowMouseEnter}
        onMouseLeave={props.onRowMouseLeave}
        onTouchStart={props.onRowTouchStart}
        onTouchEnd={props.onRowTouchEnd}
        onTouchMove={props.onRowTouchMove}
        showScrollbarY={props.showScrollbarY}
        visible={visible}
        fake={fake}
        allowColumnVirtualization={props.allowColumnVirtualization}
        {...rowProps}
      />
    );
  }
};

module.exports = FixedDataTableBufferedRows;
