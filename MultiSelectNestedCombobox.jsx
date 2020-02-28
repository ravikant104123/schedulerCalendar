import React, { Component } from 'react';
import './Combobox.css'

export default class MultiSelectNestedCombobox extends Component {
	constructor(props) {
		super(props);
		let height = props.height;
		this.numVisibleItems = height / props.itemHeight;
		if (Number(this.numVisibleItems) === this.numVisibleItems && this.numVisibleItems % 1 !== 0) {
			this.numVisibleItems = Math.ceil(this.numVisibleItems);
		}
		height = this.numVisibleItems * props.itemHeight
		this.originalSource = $.extend(true, [], this.props.source);
		this.addNestedIndexes(this.originalSource, '');
		this.state = {
			source: $.extend(true, [], this.originalSource),
			selectedItems: [],
			searchedItems: [],
			start: 0,
			end: this.numVisibleItems,
			height: height,
			activeIndex: 0,
			isSearched: false,
			validations: $.extend(true, {}, this.props.validations),
			disabled: this.props.disabled,
			label: this.props.label
		}
		this.itemClicked = false;
		this.nextFocusedElement = '';
		this.isOpen = false;
		this.direction = "";
		if (this.props.direction == "up" || this.props.direction == "top") {
			this.direction = "dropup";
		} else if (this.props.direction == "right") {
			this.direction = "dropright";
		} else if (this.props.direction == "left") {
			this.direction = "dropleft";
		}
	}

	getSelectedItems = () => {
		return [...this.state.selectedItems];
	}

	setValue = (value, config = {}) => {
		if ((typeof value == "number") || (typeof value == "string") || (Array.isArray(value))) {
			if (typeof value == "string") {
				value = value.split(",");
			} else if (typeof value == "number") {
				value = [value];
			}
			if (value.length) {
				// Added below code by Arif Shaikh to avoid duplicate selection
				let tempValue = $.extend(true, [], value);
				tempValue.map((set_id) => {
					let index = this.state.selectedItems.findIndex((obj) => obj[this.props.idField] == set_id);
					if (index > -1) {
						value.splice(value.indexOf(set_id), 1);
					}
				});
				// End of code added by Arif Shaikh
				let items = this.getItemById(value, this.state.source);
				let unique = new Set(items);
				items = [...unique];

				// sorted items by selection order
				if (this.props.multiSelect && !$.isEmptyObject(config) && config.selectionOrder) {
					let sortedItems = [];
					let foundItem = {};
					value.map((id) => {
						let findProperty = {}
						findProperty[this.props.idField] = id;
						foundItem = _.findWhere(items, findProperty);
						if (foundItem && !$.isEmptyObject(foundItem)) {
							sortedItems.push(foundItem);
						}
					});
					items = sortedItems;
				}

				if (items.length) {
					if (!this.props.multiSelect && !this.props.nested) {
						items[0].selected = true;
						this.state.selectedItems.push(items[0]);
						this.state.activeIndex = (items[0].nestedIndex + "").split('-').map(function (i) { return parseInt(i); })[0];
						this.scrollTo = Math.floor(this.state.activeIndex / this.numVisibleItems) * this.numVisibleItems * this.props.itemHeight;
					} else if (!this.props.multiSelect && this.props.nested) {
						let nestedIndex = (items[0].nestedIndex + "").split('-').map(function (i) { return parseInt(i); });
						this.state.activeIndex = nestedIndex[0];
						this.state.source.map((val) => {
							val.expanded = false;
							val.selected = false;
						})
						if (nestedIndex.length >= 2) {
							let at = 0;
							let i = 0;
							for (; i < nestedIndex.length - 1; i++) {
								let childItem = this.getItemByNestedIndex([...nestedIndex].splice(0, i + 1), this.state.source);
								if (childItem) {
									childItem.expanded = true;
									at = at + nestedIndex[i];
									if (i != 0) {
										at = at + 1;
									}
									this.addItems({ items: childItem[this.props.childField], index: at });
								}
							}
							this.state.activeIndex = at + nestedIndex[i];
							if (i != 0) {
								this.state.activeIndex = at + nestedIndex[i] + 1;
							}
						} else {
							this.state.activeIndex = nestedIndex[0];
						}
						this.state.start = 0;
						this.state.end = this.numVisibleItems;
						this.scrollTo = Math.floor(this.state.activeIndex / this.numVisibleItems) * this.numVisibleItems * this.props.itemHeight;
						items[0].selected = true;
						this.state.selectedItems.push(items[0]);
					} else if (this.props.multiSelect && !this.props.nested) {
						items.map((item) => {
							item.selected = true;
							this.state.selectedItems.push(item);
						})
					} else {
						items.sort(function (a, b) {
							let x = a.nestedIndex; let y = b.nestedIndex;
							return ((x < y) ? 1 : ((x > y) ? -1 : 0));
						});

						items.map((item) => {
							item.sequence = value.indexOf(item[this.props.idField]);
							item.selected = true;
							let nestedIndex = (item.nestedIndex + "").split('-').map(function (i) { return parseInt(i); });
							if (nestedIndex.length >= 2) {
								let at = 0;
								let i = 0;
								for (; i < nestedIndex.length - 1; i++) {
									let p = [...nestedIndex].splice(0, i + 1);
									let childItem = this.getItemByNestedIndex(p, this.state.source);
									if (childItem) {
										at = at + nestedIndex[i];

										if (i != 0) {
											at = at + 1;
										}
										if (childItem.expanded !== true) {
											childItem.expanded = true;
											this.addItems({ items: childItem[this.props.childField], index: at });
										}
									}
								}
							}
						});

						items.sort(function (a, b) {
							let x = a.sequence; let y = b.sequence;
							return ((x < y) ? -1 : ((x > y) ? 1 : 0));
						});

						this.state.selectedItems = [];
						items.map((item) => {
							item.selected = true;
							this.state.selectedItems.push(item);
						});

					}

					if (!$.isEmptyObject(config) && typeof config.triggerItemClick == "boolean" && config.triggerItemClick) {
						this.setState({ ...this.state }, () => {
							$(`#${this.props.id} .virtual-list-view-port div[data-nested-index='${items[0].nestedIndex}']`).click();
							this.triggerOnChange = true;
						});
					} else {
						this.setState({ ...this.state }, () => {
							this.triggerOnChange = true;
						});
					}
				}
			} else {
				this.clear();
			}
		}
	}

	val = () => {
		let result = [];
		this.state.selectedItems.map((item, i) => {
			result.push(item[this.props.idField]);
		});
		if (!this.props.multiSelect) {
			if (result.length) {
				if (this.props.fromWorkOrder) {
					return result;
				}
				return result[0];
			} else {
				if (this.props.fromWorkOrder) {
					return result;
				}
				return null
			}
		} else {
			return result;
		}
	}

	clear = (clearOptions = {}) => {
		this.state.selectedItems.map((item) => {
			item.selected = false;
		});
		this.state.selectedItems = [];
		this.state.activeIndex = 0;
		this.state.start = 0;
		this.state.end = this.numVisibleItems;
		this.scrollTo = 0;

		if (!clearOptions.doNotClearValidation) { //Condition added by Nikita
			if (this.state.validations.type == "tooltip") {
				$("#" + this.props.id).popover('disable');
			} else if (this.state.validations.type == "label") {
				$("#" + this.props.id + " .combobox-label-validation").hide();
			}
			$("#" + this.props.id + " .combobox-input-wrapper").removeClass('combobox-input-invalid');
		}
		this.triggerOnChange = false;
		this.setState({ ...this.state }, () => {
			if (!this.props.multiSelect) {
				$("#" + this.props.id + " .combobox-input-text").val('');
			}
		});
	}

	removeValidations = () => {
		let id = this.props.id;
		$("#" + id + " .combobox-input-wrapper").removeClass("combobox-input-invalid");
		$("#" + id + " .combobox-label-validation").hide();
	}

	validate = () => {
		let id = this.props.id;
		if (this.state.validations.rules) {
			if (typeof this.state.validations.rules == "string") {
				if (this.state.validations.rules == "mandatory") {
					if (this.state.selectedItems.length) {
						$("#" + id + " .combobox-input-wrapper").removeClass("combobox-input-invalid");
						if (this.state.validations.type == "tooltip") {
							$("#" + id).popover('disable');
						} else if (this.state.validations.type == "label") {
							$("#" + id + " .combobox-label-validation").hide();
						}
						return true;
					} else {
						$("#" + id + " .combobox-input-wrapper").addClass("combobox-input-invalid");
						if (this.state.validations.type == "tooltip") {
							$("#" + id).popover('enable').mouseover(function () {
								$(this).popover('show');
							}).mouseleave(function () {
								$(this).popover('hide');
							});
						} else if (this.state.validations.type == "label") {
							$("#" + id + " .combobox-label-validation").show();
						}
						return false;
					}
				}
			} else if (typeof this.state.validations.rules == "function") {
				return this.state.validations.rules(this, id);
			}
		}
		return true;
	}

	setOptions = (options, callback = () => { }) => {
		if (typeof options.source != 'undefined') {
			this.originalSource = $.extend(true, [], options.source);
			this.addNestedIndexes(this.originalSource, '');
			this.state.source = $.extend(true, [], this.originalSource);
		}

		if (typeof options.activeIndex == "number") {
			this.state.activeIndex = options.activeIndex
		}

		if (typeof options.validations == "object") {
			this.state.validations = options.validations
		}

		if (typeof options.disabled == "boolean") {
			this.state.disabled = options.disabled
		}
		this.setState({ ...this.state }, () => {
			setTimeout(() => {
				callback()
			}, 5);
		});
	}

	focus = () => {
		$("#" + this.props.id + " .combobox-input-text").focus();
	}

	onKeyDown = (event) => {
		if ((event.keyCode == 37 || event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 8)) {
			if (event.keyCode == 37 && event.target.selectionStart == 0 && event.target.selectionEnd == 0) {
				$("#" + this.props.id + " .combobox-selected-items .combobox-tabs").removeAttr('tabindex').last().attr('tabindex', '0').focus();
			} else if (event.keyCode == 8 && event.target.selectionStart == 0 && event.target.selectionEnd == 0) {
				let lastElement = parseInt($("#" + this.props.id + " .combobox-selected-items .combobox-tabs").last().attr('data-key'));
				this.removeSelectedItem(lastElement);
			} else if (event.keyCode == 38 || event.keyCode == 40) {
				let nextActiveIndex = 0
				let container = $("#" + this.props.id + " .virtual-list-view-port");
				let currentActiveElement = $("#" + this.props.id + " .virtual-list-item-active");
				let contHeight = container.height();
				let elementTop = 0;
				let items = this.state.isSearched ? this.state.searchedItems : this.state.source;
				let j = 0;
				if (event.keyCode == 38) {
					nextActiveIndex = this.state.activeIndex - 1;
					if (currentActiveElement.length) {
						elementTop = (currentActiveElement.offset().top - this.props.itemHeight) - container.offset().top;
					}
				} else if (event.keyCode == 40) {
					nextActiveIndex = this.state.activeIndex + 1;
					if (this.props.multiSelect && !this.props.nested) {
						if ((nextActiveIndex == items.length - this.state.selectedItems.length) && !this.state.isSearched) {
							nextActiveIndex = this.state.activeIndex;
						} else if (nextActiveIndex > items.length) {
							nextActiveIndex = this.state.activeIndex;
						}
					}
					if (currentActiveElement.length) {
						elementTop = (currentActiveElement.offset().top + this.props.itemHeight) - container.offset().top;
					}
				}

				if (typeof items[nextActiveIndex] != 'undefined') {
					if (currentActiveElement.length) {
						let elementBottom = elementTop + currentActiveElement[0].offsetHeight;
						if (!(elementTop >= 0 && elementBottom <= contHeight)) {
							if (event.keyCode == 38) {
								container.scrollTop(container.scrollTop() + elementTop);
							} else {
								container.scrollTop(container.scrollTop() + (elementBottom - contHeight));
							}
						}
					} else {
						container.scrollTop(nextActiveIndex * this.props.itemHeight);
					}
					this.state.activeIndex = nextActiveIndex;
					this.setState({ ...this.state }, () => { })
				}
			}
		}
		this.lastKey = event.keyCode;
		return true;
	}

	onKeyUp = (event) => {
		if (event.keyCode == 13) {
			if (this.props.autoComplete) {
				if ($(`#dropdown-menu-${this.props.id}`).next().hasClass('show')) {
					$("#" + this.props.id + " .virtual-list-item-active").click();
				}
				let checkDuplicateVal = {};
				let inputValue = $("#" + this.props.id + " .combobox-input-text").val();

				if (inputValue && $(`#dropdown-menu-${this.props.id}`).next().hasClass('show') && $("#" + this.props.id + " .virtual-list-item-active").length) {
					return false;
				}
				if (this.state.selectedItems.length) {
					checkDuplicateVal = _.find(this.state.selectedItems, (item) => (item.value ? item.value : item.emailId) === inputValue);
					if (!_.isEmpty(checkDuplicateVal)) {
						notification({
							message: lang('DUPLICATE_ITEM'),
							type: 'warning'
						})
					}
				}

				if (inputValue) {
					if (_.isEmpty(checkDuplicateVal) && this.props.inputValidator && this.props.inputValidator(inputValue)) {
						this.state.selectedItems.push({ 'id': 0, value: inputValue });
						this.setState({ selectedItems: this.state.selectedItems, searchedItems: [] })
						$('.combobox-input-text').val('');
					}
					this.props.onSelect(inputValue);
				} else {
					this.setState({ selectedItems: this.state.selectedItems, searchedItems: [] })
					$('.combobox-input-text').val('');
				}
			} else {
				$("#" + this.props.id + " .virtual-list-item-active").click();
			}
		} else if (event.keyCode == 36 && event.target.selectionStart == 0 && event.target.selectionEnd == 0) {
			$("#" + this.props.id + " .combobox-tabs").removeAttr('tabindex').first().attr('tabindex', '0').focus();
			this.showHideRightLeftArrow();
		} else if (event.keyCode == 39) {
			if (this.props.multiSelect) {
				if (!$("#" + this.props.id + " .combobox-input-text").val().length) {
					$("#" + this.props.id + " .virtual-list-item-active").children(".virtual-list-arrow-area").click();
				}
			} else if (event.target.selectionEnd == $("#" + this.props.id + " .combobox-input-text").val().length) {
				$("#" + this.props.id + " .virtual-list-item-active").children(".virtual-list-arrow-area").click();
			}
		} else if (event.keyCode == 37) {
			if (this.props.multiSelect) {
				if (!$("#" + this.props.id + " .combobox-input-text").val().length) {
					$("#" + this.props.id + " .virtual-list-item-active").children(".virtual-list-arrow-area").click();
				}
			} else if (event.target.selectionStart == 0) {
				$("#" + this.props.id + " .virtual-list-item-active").children(".virtual-list-arrow-area").click();
			}
		}
		return true;
	}

	onSearch = () => {
		if (this.lastKey !== 32) {
			let filterValue = $("#" + this.props.id + " .combobox-input-text").val().trim().toLowerCase();
			clearTimeout(this.typingTimer);
			if (filterValue.length) {
				this.typingTimer = setTimeout(() => {
					this.state.activeIndex = 0;
					this.state.isSearched = true;
					this.state.searchedItems = [];
					this.foundNestedIndex = [];
					$("#" + this.props.id + " .virtual-list-view-port").scrollTop(0);
					this.state.start = 0;
					this.state.end = this.numVisibleItems;
					this.getSearchedItems(this.state.source, filterValue);
					if (this.props.autoComplete) {
						if (this.state.searchedItems.length) {
							this.setState({ ...this.state }, () => {
								if (!$("#" + this.props.id + " .dropdown").hasClass('show')) {
									$("#dropdown-menu-" + this.props.id).dropdown('toggle');
								}
							})
						} else {
							if ($("#" + this.props.id + " .dropdown").hasClass('show')) {
								$("#dropdown-menu-" + this.props.id).dropdown('toggle');
							}
						}
					} else {
						this.setState({ ...this.state }, () => {
							if (!$("#" + this.props.id + " .dropdown").hasClass('show')) {
								$("#dropdown-menu-" + this.props.id).dropdown('toggle');
							}
							this.foundNestedIndex = [];
						})
					}
				}, 250);
			} else {
				this.state.activeIndex = 0;
				this.state.isSearched = false;
				this.state.searchedItems = [];
				if (!this.props.multiSelect && this.state.selectedItems.length) {
					if (typeof this.props.onItemDeselect == "function") {
						let result = this.props.onItemDeselect(this.state.selectedItems[0]);
						if (result === false) {
							return false;
						}
					}
					this.state.selectedItems[0].selected = false;
					this.state.selectedItems = [];
					this.state.start = 0;
					this.state.end = this.numVisibleItems;
					this.scrollTo = 0;
					$("#" + this.props.id + " .virtual-list-view-port").scrollTop(0);
				}
				this.setState({ ...this.state })
			}
		}
	}

	getSearchedItems = (items, filterValue) => {
		if (Array.isArray(items) && items.length) {
			items.map((item) => {
				if (this.props.autoComplete) {
					if ((item[this.props.displayField].toLowerCase().indexOf(filterValue) !== -1) || (item[this.props.emailField].toLowerCase().indexOf(filterValue) !== -1)) {
						if (this.foundNestedIndex.indexOf(item['nestedIndex']) == -1) {
							this.state.searchedItems.push(item);
							this.foundNestedIndex.push(item['nestedIndex']);
						}
					}
				} else {
					if (item[this.props.displayField].toLowerCase().indexOf(filterValue) !== -1) {
						if (this.foundNestedIndex.indexOf(item['nestedIndex']) == -1) {
							this.state.searchedItems.push(item);
							this.foundNestedIndex.push(item['nestedIndex']);
						}
					}
				}
				if (Array.isArray(item[this.props.childField]) && item[this.props.childField].length) {
					this.getSearchedItems(item[this.props.childField], filterValue);
				}
			});
		} else if (!$.isEmptyObject(items)) {
			if (items[this.props.displayField].toLowerCase().indexOf(filterValue) !== -1) {
				if (this.foundNestedIndex.indexOf(item['nestedIndex']) == -1) {
					this.state.searchedItems.push(item);
					this.foundNestedIndex.push(item['nestedIndex']);
				}
				if (Array.isArray(items[this.props.childField]) && items[this.props.childField].length) {
					this.getSearchedItems(items[this.props.childField], filterValue);
				}
			}
		}
	}

	onItemClick = (event, index, nestedIndex) => {
		this.itemClicked = true;
		let items = this.state.source[index];
		if (this.state.isSearched) {
			items = this.getItemByNestedIndex(nestedIndex, this.state.source);
		}

		/** Added by Prabhat on 21st Dec 2018*/
		if (items.is_enable != undefined && !items.is_enable) {
			return false;
		}

		if (this.props.onItemClick) {
			let result = this.props.onItemClick(event, index, nestedIndex, items)
			if ((result !== undefined) && (!result)) {
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
		}
		if (items) {
			let oldValue = [...this.state.selectedItems];
			let isSelected = (items.selected === true) ? false : true;
			if (this.props.multiSelect) {
				items.index = index;
				items.selected = isSelected;
				items.nestedIndex = nestedIndex;
				if (this.props.nested) {
					if (isSelected === true) {
						this.state.selectedItems.push(items);
					} else {
						let selectedItemIndex = $("#" + this.props.id + " .combobox-tabs[data-nested-index='" + nestedIndex + "']").attr('data-key')
						selectedItemIndex = parseInt(selectedItemIndex);
						if (!isNaN(selectedItemIndex)) {
							this.state.selectedItems.splice(selectedItemIndex, 1);
						}
					}
				} else {
					if (isSelected) {
						this.state.selectedItems.push(items);
					}
				}
			} else {
				if (isSelected === true) {
					if (this.state.selectedItems.length) {
						this.state.selectedItems[0].selected = false;
					}
					items.index = index;
					items.selected = isSelected;
					items.nestedIndex = nestedIndex;
					this.state.selectedItems = [items];
				}
			}
			$("#" + this.props.id + " .combobox-input-text").focus();
			this.state.isSearched = false;
			this.state.searchedItems = [];
			if (this.props.onChange || (this.state.validations.trigger && (this.state.validations.trigger.indexOf("change") != -1))) {
				if (oldValue.length != this.state.selectedItems.length) {
					this.triggerOnChange = true;
				} else {
					let oldIds = [];
					let newIds = [];
					oldValue.map((item) => {
						oldIds.push(item[this.props.idField]);
					})
					this.state.selectedItems.map((item) => {
						newIds.push(item[this.props.idField]);
					});
					if ($(oldIds).not(newIds).get().length) {
						this.triggerOnChange = true;
					}
				}
			}
			if (this.props.multiSelect) {
				if (!this.props.nested)
					if (this.state.activeIndex == (this.state.source.length - this.state.selectedItems.length)) {
						this.state.activeIndex--;
					}
			} else {
				this.state.activeIndex = parseInt(index);
			}
			this.setState({ ...this.state });
		}
	}

	removeSelectedItem = (j) => {
		j = parseInt(j);
		if (!isNaN(j)) {
			if (j + 1 == $("#" + this.props.id + " .combobox-selected-items .combobox-tabs").length) {
				this.nextFocusedElement = "#" + this.props.id + " .combobox-input-text"
			} else {
				this.nextFocusedElement = "#" + this.props.id + " .combobox-selected-items .combobox-tabs[data-key=" + j + "]";
			}

			let nestedIndex = $("#" + this.props.id + " .combobox-selected-items .combobox-tabs[data-key='" + j + "']").attr('data-nested-index')

			let item = this.getItemByNestedIndex(nestedIndex, this.state.source);
			if (item) {
				if (typeof this.props.onItemDeselect == "function") {
					let result = this.props.onItemDeselect(item);
					if (result === false) {
						return false;
					}
				}
				item.selected = false;
				this.state.selectedItems.splice(j, 1);
				this.setState({ ...this.state });
			} else if (this.props.autoComplete) {
				this.state.selectedItems.splice(j, 1);
				this.setState({ ...this.state });
			}
		}
	}

	scrollPos = (event) => {
		let currentIndx = Math.trunc($(event.target).scrollTop() / this.props.itemHeight);
		let totalItems = this.state.isSearched ? this.state.searchedItems.length : this.state.source.length;
		currentIndx = currentIndx - this.numVisibleItems >= totalItems ? currentIndx - this.numVisibleItems : currentIndx;
		if (currentIndx !== this.state.start) {
			this.state.start = currentIndx;
			this.state.end = currentIndx + this.numVisibleItems >= totalItems ? totalItems - 1 : currentIndx + this.numVisibleItems
			this.setState({ ...this.state });
		}
	}

	load = () => {
		if (!$.isEmptyObject(this.props.store)) {
			let paramsForAjax = {
				dataType: "json"
			};
			let root = "data";

			for (let idx in this.props.store) {
				if (idx == "url" && this.props.store[idx]) {
					paramsForAjax.url = this.props.store[idx];
				} else if (idx == "method") {
					paramsForAjax.type = (this.props.store[idx]) ? this.props.store[idx] : "GET";
				} else if (idx == "data") {
					paramsForAjax.data = this.props.store[idx];
				} else if (idx == "datafields" && typeof this.props.store[idx].length != "undefined" && this.props.store[idx].length) {
					dataFields = this.props.store[idx];
				} else if (idx == "root") {
					root = this.props.store[idx];
				} else if (idx == "async") {
					paramsForAjax.asynch = this.props.store[idx];
				} else if (idx == "dataType") {
					paramsForAjax.dataType = (this.props.store[idx]) ? this.props.store[idx] : "json";
				}
			}
			paramsForAjax.success = (response) => {
				if (typeof response == "string") {
					let json = JSON.parse(response);
					if (json) {
						response = json
					}
				}
				this.setOptions({
					source: (response[root] != "undefined") ? response[root] : []
				}, () => {
					setTimeout(() => {
						if (typeof this.props.value != "undefined") {
							this.setValue(this.props.value);
						}
						if (typeof this.props.store.success == "function") {
							this.props.store.success(response)
						}
					}, 100);
				});
			}

			$.ajax(paramsForAjax);
		}
	}

	showHideRightLeftArrow = () => {
		if ($("#" + this.props.id + " .combobox-selected-items")[0].scrollWidth > $("#" + this.props.id + " .combobox-selected-items")[0].clientWidth) {
			if ($("#" + this.props.id + " .combobox-selected-items").scrollLeft() != 0 && (Math.ceil($("#" + this.props.id + " .combobox-selected-items")[0].offsetWidth + $("#" + this.props.id + " .combobox-selected-items")[0].scrollLeft) < Math.ceil($("#" + this.props.id + " .combobox-selected-items")[0].scrollWidth))) {
				$("#" + this.props.id + " .combobox-right-left-arrow-keys").removeClass('d-none')
			} else if ($("#" + this.props.id + " .combobox-selected-items").scrollLeft() == 0) {
				$("#" + this.props.id + " .left-arrow-key").addClass('d-none');
				$("#" + this.props.id + " .right-arrow-key").removeClass('d-none');
			} else {
				$("#" + this.props.id + " .right-arrow-key").addClass('d-none');
				$("#" + this.props.id + " .left-arrow-key").removeClass('d-none');
			}
		}
	}

	enable = () => {
		this.setState({ disabled: false });
	}

	disable = () => {
		this.setState({ disabled: true });
	}

	componentDidMount() {
		let id = this.props.id;

		$("#" + id + " .virtual-list-item-container").height(this.state.source.length * this.props.itemHeight);

		$("#" + id + " .dropdown-menu").css({ 'width': $("#" + id).width().toFixed(1) }).addClass('d-none');
		$("#dropdown-menu-" + id).dropdown('toggle');
		$("#dropdown-menu-" + id).dropdown('toggle');
		$("#" + id + " .dropdown-menu").removeClass('d-none');

		$("#" + id + " .dropdown").keydown(function (event) {
			if (event.keyCode == 40 && !$("#" + id + " .dropdown").hasClass('show')) {
				event.stopPropagation();
				event.preventDefault();
				$("#dropdown-menu-" + id).dropdown('toggle');
				return false;
			}
		});

		$("#" + id + " .dropdown").on({
			'show.bs.dropdown': () => {
				$("#" + id + " .dropdown-menu").css({ 'width': $("#" + id).width().toFixed(1) })
			},
			'shown.bs.dropdown': () => {
				if (typeof this.scrollTo == "number") {
					$("#" + id + " .virtual-list-view-port").scrollTop(0);
					setTimeout(() => {
						if (this.scrollTo == 0) {
							$("#" + id + " .virtual-list-view-port").scrollTop(1).scrollTop(0);
						} else {
							$("#" + id + " .virtual-list-view-port").scrollTop(this.scrollTo);
						}
						this.scrollTo = null;
					}, 30);
				}
				this.isOpen = true;
				if (this.props.showDropDownArrow) {
					$("#" + id + " .combobox-input-wrapper .combobox-up-down-arrow .fa-caret-down").addClass("fa-caret-up").removeClass("fa-caret-down");
				}
			},
			'hidden.bs.dropdown': () => {
				$("#" + id + " .combobox-input-wrapper").removeClass('no-border-bottom-radius').removeClass('no-border-top-radius');
				this.isOpen = false;
				if (this.props.showDropDownArrow) {
					$("#" + id + " .combobox-input-wrapper .combobox-up-down-arrow .fa-caret-up").addClass("fa-caret-down").removeClass("fa-caret-up");
				}
				if (this.props.getSelectedValue) {
					this.props.getSelectedValue();
				}
			},
			'hide.bs.dropdown': (e) => {
				if (this.props.multiSelect) {
					if (this.state.selectedItems.length) {
						if (this.props.nested) {
							let selectedIds = [];
							this.state.selectedItems.map((item) => {
								selectedIds.push(item[this.props.idField]);
							});
							$("#" + id + " .virtual-list-view-port").scrollTop(0);
							this.state.activeIndex = 0;
							this.state.start = 0;
							this.state.end = this.numVisibleItems;
							this.state.source = $.extend(true, [], this.originalSource);
							this.state.selectedItems = [];
							this.setValue(selectedIds);
						} else {
							$("#" + id + " .virtual-list-view-port").scrollTop(0);
							this.state.activeIndex = 0;
							this.state.start = 0;
							this.state.end = this.numVisibleItems;
							this.setState({ ...this.state });
						}
					} else {
						if (this.props.nested) {
							$("#" + id + " .virtual-list-view-port").scrollTop(0);
							this.state.activeIndex = 0;
							this.state.start = 0;
							this.state.end = this.numVisibleItems;
							this.setState({ ...this.state });
						} else {
							$("#" + id + " .virtual-list-view-port").scrollTop(0);
							this.state.activeIndex = 0;
							this.state.start = 0;
							this.state.end = this.numVisibleItems;
							this.setState({ ...this.state });
						}
					}
				} else {
					if (this.state.selectedItems.length) {
						if (this.props.nested) {
							let selectedIds = [];
							this.state.selectedItems.map((item) => {
								selectedIds.push(item[this.props.idField]);
							});
							this.state.source = $.extend(true, [], this.originalSource);
							this.state.selectedItems = [];
							this.setValue(selectedIds);
						} else {
							this.state.activeIndex = (this.state.selectedItems[0].nestedIndex + "").split('-').map(function (i) { return parseInt(i); })[0];
							this.scrollTo = Math.floor(this.state.activeIndex / this.numVisibleItems) * this.numVisibleItems * this.props.itemHeight;
							this.setState({ ...this.state });
						}
					} else {
						$("#" + id + " .virtual-list-view-port").scrollTop(0);
						this.state.activeIndex = 0;
						this.state.start = 0;
						this.state.end = this.numVisibleItems;
						this.setState({ ...this.state });
					}
				}
				if (this.props.keepOpen) {
					e.preventDefault();
					e.stopPropagation();
					return false;
				}
			}
		});

		$("#dropdown-menu-" + this.props.id).keydown((event) => {
			if (event.keyCode == 27 && $("#" + this.props.id + " .dropdown").hasClass('show')) {
				$("#dropdown-menu-" + this.props.id).dropdown("toggle");
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
		});

		$("#" + id + " .combobox-input-wrapper").click(function () { $("#" + id + " .combobox-input-text").focus(); });

		$("#" + id + " .combobox-input-text").on({
			'click': function (event) {
				if ($("#" + id + " .dropdown-menu").hasClass('show')) {
					event.stopPropagation();
					event.preventDefault();
					return false;
				}
			},
			'focus': () => {
				$("#" + id + " .combobox-input-wrapper").addClass('combobox-focused')
				if (!this.state.selectedItems.length) {
					$("#" + id + " .combobox-right-left-arrow-keys").addClass('d-none');
				}
			},
			'blur': () => {
				setTimeout(() => {
					if (!($("#" + id + " .combobox-input-text").is(":focus") || $("#" + id + " .combobox-tabs").is(":focus"))) {
						if (!this.props.multiSelect) {
							if (!this.state.selectedItems.length) {
								this.state.activeIndex = 0;
							}
							this.state.searchedItems = [];
							this.state.isSearched = false;
							this.setState({ ...this.state });
						}
						$("#" + id + " .combobox-input-wrapper").removeClass('combobox-focused');
					}
				}, 300);
			},
		})

		$("#" + id + " .combobox-selected-items").on({
			'click': (e) => {
				/* if (this.props.autoComplete) {
					e.stopPropagation();
					e.preventDefault();
					if ($(e.target).hasClass('combobox-remove-selected-item')) {
						this.removeSelectedItem($(e.target).attr('data-key'));
					}
					return;
				} */
				if ($(e.target).hasClass('combobox-remove-selected-item')) {
					if (this.props.onItemRemoveClick) {
						this.props.onItemRemoveClick(e, $(e.target).attr('data-key'))
					} else {
						this.removeSelectedItem($(e.target).attr('data-key'));
					}
				} else if ($(e.target).hasClass('combobox-tabs')) {
					$("#" + id + " .combobox-tabs").removeAttr('tabindex');
					$(e.target).attr('tabindex', '0').focus();
					$("#" + id + " .combobox-input-wrapper").addClass('combobox-focused');
				} else {
					$("#" + id + " .combobox-input-text").focus();
					if ($("#" + id + " .dropdown-menu").hasClass('show')) {
						e.stopPropagation();
						e.preventDefault();
						return false;
					} else if (!this.props.autoComplete) {
						$("#dropdown-menu-" + id).dropdown("toggle");
					}
				}
				e.stopPropagation();
			},
		});

		$("#" + id + " .combobox-right-left-arrow-keys").click((e) => {
			let selectedItemsDiv = $("#" + id + " .combobox-selected-items");
			if ($(e.target).hasClass("left-arrow-key") || $(e.target).parent().hasClass("left-arrow-key")) {
				selectedItemsDiv.animate({ scrollLeft: selectedItemsDiv.scrollLeft() - (Math.floor(selectedItemsDiv[0].clientWidth / 1.5)) }, 50, () => {
					this.showHideRightLeftArrow();
				})
			} else {
				selectedItemsDiv.animate({ scrollLeft: selectedItemsDiv.scrollLeft() + (Math.floor(selectedItemsDiv[0].clientWidth / 1.5)) }, 50, () => {
					this.showHideRightLeftArrow();
				})
			}
			$("#" + id + " .combobox-input-text").focus();
			e.stopPropagation();
		});

		$("#" + this.props.id + " .combobox-selected-items").keydown((event) => {
			let nextElement = 0;
			if ($(event.target).hasClass('combobox-tabs')) {
				if ((event.keyCode == 37 || event.keyCode == 39)) {
					if (event.keyCode == 37) {
						nextElement = parseInt($(event.target).attr('data-key')) - 1;
					} else {
						nextElement = parseInt($(event.target).attr('data-key')) + 1;
					}
					if ($("#" + this.props.id + " .combobox-selected-items .combobox-tabs[data-key=" + nextElement + "]").length) {
						$("#" + this.props.id + " .combobox-selected-items .combobox-tabs").removeAttr('tabindex');
						$("#" + this.props.id + " .combobox-selected-items .combobox-tabs[data-key=" + nextElement + "]").attr('tabindex', '0').focus();
					} else if (event.keyCode == 39) {
						$("#" + this.props.id + " .combobox-selected-items .combobox-tabs").removeAttr('tabindex');
						$("#" + this.props.id + " .combobox-input-text").focus();
						this.showHideRightLeftArrow();
						return false;
					}
				} else if (event.keyCode == 8 || event.keyCode == 46) {
					nextElement = parseInt($(event.target).attr('data-key'));
					this.removeSelectedItem(nextElement);
				} else if (event.keyCode == 35) {
					$("#" + this.props.id + " .combobox-selected-items .combobox-tabs").removeAttr('tabindex');
					$("#" + this.props.id + " .combobox-input-text").focus();
					this.showHideRightLeftArrow();
					return false;
				} else if (event.keyCode == 36) {
					$("#" + this.props.id + " .combobox-tabs").removeAttr('tabindex').first().attr('tabindex', '0').focus();
				}
				this.showHideRightLeftArrow();
			}
		});

		$("#" + id + " .virtual-list-view-port").click((event) => {
			if ($(event.target).hasClass("virtual-list-arrow-area") || $(event.target).parents(".virtual-list-arrow-area").length) {
				let index = $(event.target).parents(".virtual-list-item").attr("data-index");
				let nestedIndex = $(event.target).parents(".virtual-list-item").attr("data-nested-index");
				let item = this.getItemByNestedIndex(nestedIndex, this.state.source);
				if (item) {
					if (typeof item.expanded == "undefined" || item.expanded === false) {
						item.expanded = true;
						this.addItems({ items: item[this.props.childField], index: index });
						if (index < this.state.activeIndex) {
							this.state.activeIndex += item[this.props.childField].length;
						}
						if (this.state.end < this.numVisibleItems) {
							this.state.end = this.numVisibleItems;
						}
						this.setState({ ...this.state }, () => {
							$(event.target).closest(".arrow-icon").removeClass("fa-caret-right").addClass("fa-caret-down")
						});
					} else {
						this.expandedItemsCount = 0;
						this.removeItems(item);
						this.state.source.splice((parseInt(index) + 1), this.expandedItemsCount)
						if (index < this.state.activeIndex) {
							this.state.activeIndex -= this.expandedItemsCount;
						}
						this.setState({ ...this.state }, () => {
							$(event.target).closest(".arrow-icon").removeClass("fa-caret-down").addClass("fa-caret-right")
						});
					}
				}
				event.preventDefault();
				event.stopPropagation();
				$("#" + id + " .combobox-input-text").focus();
			} else if ($(event.target).hasClass("virtual-list-item") || $(event.target).parents(".virtual-list-item").length) {
				let item = $(event.target);
				if (!$(event.target).hasClass("virtual-list-item")) {
					item = $(event.target).parents(".virtual-list-item");
				}
				this.onItemClick(event, item.attr("data-index"), item.attr("data-nested-index"));
				if (this.props.multiSelect) {
					event.preventDefault();
					event.stopPropagation();
				}
			} else {
				$("#" + id + " .combobox-input-text").focus();
				event.preventDefault();
				event.stopPropagation();
			}
		});

		this.load();

		if (typeof this.props.value != "undefined") {
			this.setValue(this.props.value);
		}
	}

	componentWillReceiveProps(nextProps) {
		if (this.state.disabled != nextProps.disabled) {
			this.setState({
				disabled: nextProps.disabled
			});
		}
	}

	componentDidUpdate() {
		let id = this.props.id;
		if (this.state.isSearched) {
			$("#" + id + " .virtual-list-item-container").height(this.state.searchedItems.length * this.props.itemHeight);
		} else {
			let height = this.state.source.length * this.props.itemHeight;
			if (!this.props.nested && this.props.multiSelect && this.state.selectedItems.length) {
				height = (this.state.source.length - this.state.selectedItems.length) * this.props.itemHeight;
			}
			$("#" + id + " .virtual-list-item-container").height(height);
		}

		if (this.state.selectedItems.length) {
			if ($("#" + this.props.id + " .combobox-selected-items")[0].scrollWidth > $("#" + this.props.id + " .combobox-selected-items")[0].clientWidth) {
				$("#" + this.props.id + " .left-arrow-key").removeClass('d-none');
				if (this.itemClicked) {
					if (this.props.multiSelect) {
						$("#" + this.props.id + " .combobox-input-text").css('width', 10);
					}
					$("#" + this.props.id + " .combobox-selected-items").scrollLeft($("#" + this.props.id + " .combobox-selected-items")[0].scrollWidth);
					$("#" + id + " .right-arrow-key").addClass('d-none');
					this.itemClicked = false;
				}
			} else {
				$("#" + this.props.id + " .combobox-right-left-arrow-keys").addClass('d-none');
			}
		} else {
			$("#" + this.props.id + " .combobox-right-left-arrow-keys").addClass('d-none');
		}

		if (this.nextFocusedElement) {
			$(this.nextFocusedElement).attr('tabindex', '0').focus();
			this.nextFocusedElement = '';
		}

		if (this.triggerOnChange) {
			if (this.props.onChange) {
				this.props.onChange();
			}
			if (this.state.validations.trigger && (this.state.validations.trigger.indexOf('change') != -1)) {
				this.validate();
			}
		}

		if (!this.props.multiSelect && !this.state.isSearched) {
			if (this.state.selectedItems.length) {
				if (this.props.preventClickSearched) {
					$("#" + this.props.id + " .combobox-input-text").val('');
					$("#" + this.props.id + " .combobox-input-text").attr("placeholder", this.props.placeholder);
				} else {
					$("#" + this.props.id + " .combobox-input-text").val(this.state.selectedItems[0][this.props.displayField]);
				}
			} else {
				$("#" + this.props.id + " .combobox-input-text").val('');
			}
		} else if (!this.state.isSearched) {
			$("#" + this.props.id + " .combobox-input-text").val('');
		}
	}

	componentWillUnmount() {
		$("#" + this.props.id).popover('dispose');
	}

	renderRows = (items) => {
		let result = [];
		let item;
		let filterValue = ""
		if ($("#" + this.props.id + " .combobox-input-text").length) {
			filterValue = $("#" + this.props.id + " .combobox-input-text").val();
		}
		let height = this.state.height;
		if (!(!this.props.nested && this.props.multiSelect)) {
			if (this.state.source.length && (height > (this.state.source.length * this.props.itemHeight))) {
				height = (this.state.source.length * this.props.itemHeight)
			}
		}
		if (items.length) {
			for (let i = this.state.start, visibleIndex = this.state.start; visibleIndex <= this.state.end; i++) {
				if (typeof items[i] != "undefined") {
					if (!this.props.nested && this.props.multiSelect && items[i].selected) {
						continue;
					}
					item = items[i];
					let level = (item.nestedIndex + "").split('-').length;
					result.push(
						<div
							key={i}
							data-index={i}
							data-nested-index={item.nestedIndex}
							data-visible-index={visibleIndex}
							className={"virtual-list-item" + (item.selected === true ? ' virtual-list-item-selected ' : ' ') + (this.state.activeIndex == visibleIndex ? " virtual-list-item-active" : " ") + (item.is_enable != undefined && !item.is_enable ? " row-disabled" : "")}
							style={{ top: visibleIndex * this.props.itemHeight, height: this.props.itemHeight, paddingLeft: ((!this.state.isSearched) ? (level - 1) * 10 : 0) }}
							title={this.props.rowRenderer ? "" : item[this.props.displayField]}
						>
							{
								!this.state.isSearched && typeof item[this.props.childField] != "undefined" && Array.isArray(item[this.props.childField]) && item[this.props.childField].length ?
									<div className="virtual-list-arrow-area">
										<div className={"fas " + (item.expanded === true ? " fa-caret-down " : " fa-caret-right ") + " arrow-icon combobox-item-icon"}></div>
									</div>
									:
									<div className="virtual-list-no-arrow-icon"></div>
							}
							<div className="virtual-list-value-area combobox-ellipsed">
								{
									this.props.rowRenderer ? this.props.rowRenderer(item, i, visibleIndex, filterValue) : item[this.props.displayField]
								}
							</div>
						</div>
					);
					visibleIndex++;
				} else {
					break;
				}
			}
			if (result.length) {
				return result;
			}
			return <div className="combobox-no-record-found-div" style={{ display: 'flex', height: height }}>{lang('NO_RECORD_FOUND')}</div>
		} else {
			return <div className="combobox-no-record-found-div" style={{ display: 'flex', height: height }}>{lang('NO_RECORD_FOUND')}</div>
		}
	}

	render() {
		let id = this.props.id;
		let height = this.state.height;
		if (!(!this.props.nested && this.props.multiSelect)) {
			if (this.state.source.length && (height > (this.state.source.length * this.props.itemHeight))) {
				height = (this.state.source.length * this.props.itemHeight)
			}
		}
		return (
			<React.Fragment>
				{
					this.state.label ?
						<label className={"ellipsed " + (this.state.disabled ? " label-disabled " : "")} >{this.state.label}</label>
						:
						null
				}
				<div id={this.props.id} className={"combobox-247 " + (!this.props.multiSelect ? " single-select-nested-combobox " : "") + (this.state.disabled ? " multiselect-nested-combobox-diabled " : "") + this.props.className}
					data-toggle="popover"
					data-html={true}
					data-trigger="manual"
					data-boundary="viewport"
					data-content={this.state.validations ? this.state.validations.message : ''}
					data-template='<div class="popover myPopover"><div class="arrow popover-arrow"></div><div class="popover-body popover-text"></div></div>'
				>
					<div className={"dropdown " + this.direction} style={{ width: this.props.width }}>
						<div className="combobox-input-wrapper dropdown-toggle" id={"dropdown-menu-" + this.props.id} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{ ...this.props.style }} data-boundary={this.props.boundary}>
							<div className={"combobox-selected-items-input-wrapper " + ((!this.props.showDropDownArrow) ? " combobox-no-up-down-arrow " : "")}>
								{
									(!(!this.props.multiSelect || isTouchDevice)) ? <div className="combobox-right-left-arrow-keys left-arrow-key d-none"><div className="fas fa-caret-left"></div></div> : null
								}
								<div className="combobox-selected-items" style={{ overflow: isTouchDevice ? 'auto' : 'hidden' }}>
									{
										this.props.multiSelect ?
											this.state.selectedItems.map((item, j) => {
												return <div className="combobox-tabs" key={j + '_' + item.id} data-key={j} title={!this.props.valueRenderer ? item[this.props.displayField] : ""} data-nested-index={item.nestedIndex}
													onFocus={function (event) {
														$("#" + id + " .combobox-input-wrapper").addClass('combobox-focused');
														if ($(event.target).attr('data-key') == 0) {
															$("#" + id + " .combobox-selected-items").scrollLeft(0);
														} else if ($(event.target).attr('data-key') == $(".combobox-tabs").last().attr('data-key')) {
															$("#" + id + " .combobox-selected-items").scrollLeft($("#" + id + " .combobox-selected-items")[0].offsetWidth + $("#" + id + " .combobox-selected-items")[0].scrollLeft)
														}
													}}
													onBlur={function (event) { $("#" + id + " .combobox-input-wrapper").removeClass('combobox-focused') }}
												>{this.props.valueRenderer ? this.props.valueRenderer(item, j) : item[this.props.displayField]}&nbsp;<div className="fas fa-times combobox-remove-selected-item" data-key={j} ></div></div>
											})
											:
											null
									}
									<input className="input combobox-input-text" tabIndex={this.props.tabIndex} type="text" autoCapitalize="none" autoComplete="off" autoCorrect="off" spellCheck="false"
										style={{ width: (this.state.selectedItems.length && this.props.multiSelect ? "10px" : "99%") }}
										placeholder={this.state.selectedItems.length ? "" : this.props.placeholder}
										onKeyDown={(event) => { this.onKeyDown(event) }}
										onKeyUp={(event) => { this.onKeyUp(event) }}
										readOnly={this.props.isReadonly ? true : false}
										onChange={(event) => {
											if (this.props.multiSelect) {
												if (this.state.selectedItems.length || $(event.target).val().length) {
													$(event.target).width(10 + ($(event.target).val().length) * 6);
												} else {
													$(event.target).width("100%").attr('placeholder', this.props.placeholder);
												}
											}
											setTimeout(() => {
												let selectedItemsDiv = $("#" + this.props.id + " .combobox-selected-items");
												selectedItemsDiv.scrollLeft(Math.ceil(selectedItemsDiv[0].offsetWidth + selectedItemsDiv[0].scrollLeft + 20));
												this.showHideRightLeftArrow();
												this.onSearch(event);
											}, 10);
										}}
										disabled={this.state.disabled ? true : false}
									/>
								</div>
								{
									(!(!this.props.multiSelect || isTouchDevice)) ? <div className="combobox-right-left-arrow-keys right-arrow-key d-none"><div className="fas fa-caret-right"></div></div> : null
								}
							</div>
							{
								this.props.showDropDownArrow ?
									<div className="combobox-up-down-arrow">
										<div className="fas fa-caret-down"></div>
									</div>
									:
									null
							}
						</div>
						<div className="dropdown-menu" aria-labelledby={"dropdown-menu-" + this.props.id} style={this.props.dropdownListStyle}>
							<div className="virtual-list-view-port" onScroll={this.scrollPos} style={{ height: height }} tabIndex="-1">
								<div className={"virtual-list-item-container" + (!this.props.multiSelect ? " single-select-virtual-list " : "")}>
									{
										this.state.isSearched ? this.renderRows(this.state.searchedItems) : this.renderRows(this.state.source)
									}
								</div>
							</div>
						</div>
					</div>
					<div className="text-right combobox-label-validation" style={{ width: this.props.width, display: "none" }}>
						<label htmlFor={this.props.id} className="combobox-error-label combobox-ellipsed" title={this.state.validations.message}>{this.state.validations.message}</label>
					</div>
				</div>
			</React.Fragment>
		);
	}

	addItems = (options) => {
		if (!$.isEmptyObject(options) && Array.isArray(options.items)) {
			if (typeof options.index != 'undefined' && !isNaN(parseInt(options.index))) {
				let firstItems = this.state.source.splice(0, (parseInt(options.index) + 1));
				this.state.source = [...firstItems, ...options.items, ...this.state.source];
			} else {
				this.state.source.push(options.items);
			}
		}
	}

	removeItem = (options) => {
		if (!$.isEmptyObject(options)) {
			if (typeof options.index != 'undefined' && !isNaN(parseInt(options.index))) {
				if (options.numberOfItems && !isNaN(parseInt(options.numberOfItems))) {
					this.state.source.splice(parseInt(options.index), parseInt(options.numberOfItems));
				} else {
					this.state.source.splice(parseInt(options.index), 1);
				}
			} else if (typeof options.id != 'undefined') {
				this.state.source.map((item, i) => {
					if (item[this.props.idField] == options.id) {
						this.state.source.splice(i, 1);
					}
				});
			}
		}
	}

	removeItems = (items) => {
		if (typeof items[this.props.childField] != 'undefined' && items[this.props.childField].length && items.expanded == true) {
			this.expandedItemsCount = this.expandedItemsCount + items[this.props.childField].length;
			items.expanded = false;
			items[this.props.childField].map((item) => {
				if (item.expanded === true) {
					this.removeItems(item);
					item.expanded = false;
				}
			});
		}
	}

	getItemAt = (item, at) => {
		if (at.length > 1) {
			let index = parseInt(at[0]);
			if (!isNaN(index) && typeof item[index] != "undefined") {
				let b = at.splice(0, 1);
				return this.getItemAt(item[b[0]][this.props.childField], at);
			}
		} else if (at.length == 1) {
			let index = parseInt(at[0]);
			return item[index];
		} else {
			return item;
		}
	}

	addNestedIndexes = (items, currentIndex) => {
		if (Array.isArray(items) && items.length) {
			items.map((item, i) => {
				item.nestedIndex = currentIndex !== '' ? currentIndex + "-" + i : i + '';
				if (typeof item[this.props.childField] != "undefined" && item[this.props.childField].length) {
					this.addNestedIndexes(item[this.props.childField], item.nestedIndex);
				}
			});
		} else if (!$.isEmptyObject(items)) {
			items.nestedIndex = currentIndex;
		}
	}

	getItemById = (ids, source, foundItems = []) => {
		if (typeof ids == "string" || typeof ids == "number" || Array.isArray(ids)) {
			if (typeof ids == "string") {
				ids = ids.split(",");
			} else if (typeof ids == "number") {
				ids = [ids];
			}
			source.map((item) => {
				if (ids.indexOf(item[this.props.idField]) != -1) {
					foundItems.push(item);
				}
				if (Array.isArray(item[this.props.childField]) && item[this.props.childField].length) {
					this.getItemById(ids, item[this.props.childField], foundItems);
				}
			});
			return foundItems;
		}
		return [];
	}

	getItemByNestedIndex = (nestedIndex, items) => {
		if (typeof nestedIndex == "number") {
			nestedIndex += "";
		} else if (Array.isArray(nestedIndex) && nestedIndex.length) {
			nestedIndex = nestedIndex.join('-');
		}

		if (typeof nestedIndex == "string" && nestedIndex.length) {
			if ((typeof items['nestedIndex'] != "undefined") && items['nestedIndex'] == nestedIndex) {
				return items;
			}
			if ((typeof items[this.props.childField] != "undefined") && Array.isArray(items[this.props.childField]) && items[this.props.childField].length) {
				let item = this.getItemByNestedIndex(nestedIndex, items[this.props.childField]);
				if (item != null) {
					return item;
				}
			}
			if (Array.isArray(items) && items.length) {
				let totalItems = items.length;
				for (let i = 0; i < totalItems; i++) {
					let item = this.getItemByNestedIndex(nestedIndex, items[i]);
					if (item != null) {
						return item;
					}
				}
			}
		}
		return null;
	}
}


MultiSelectNestedCombobox.defaultProps = {
	id: Date.now() + '' + Math.floor(Math.random() * (10000)) + 100000,
	className: " ",
	width: "100%",
	style: {},
	source: [],
	idField: "id",
	displayField: "value",
	childField: "options",
	height: 161,
	itemHeight: 23,
	store: {},
	placeholder: "",
	dropdownListStyle: {},
	multiSelect: true,
	nested: true,
	validations: {},
	/* boundryDetection: true, */
	boundary: 'viewport',
	showDropDownArrow: true,
	keepOpen: false,
	disabled: false,
	label: '',
	autoComplete: false,
	direction: "",
	onSelect: () => { }
}