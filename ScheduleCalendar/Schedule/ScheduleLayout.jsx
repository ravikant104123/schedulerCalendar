import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import SubHeader from 'components/SubHeader.jsx';
import CalendarNavigation from './CalendarNavigation.jsx';
import ConversationScheduler from './ConversationScheduler.jsx';
import { checkUserPermission, checkTextCredits, showLowTextCreditNotification } from "common/CommonFunctions.jsx";
import MultiSelectNestedCombobox from 'components/Common/Combobox/MultiSelectNestedCombobox.jsx';
import JqxPopover from 'jqwidgets-react/react_jqxpopover.js';
import PageUnavailable from 'components/Common/PageUnavailable.jsx';

import 'components/Conversations/Layout.css';

class ScheduleLayout extends Component {
	constructor(props) {
		super(props);
		this.state = {
			date: new Date(moment(new Date()).tz(props.userData.timezone_id)._d),
			selectedMonthDate: new Date(moment(new Date()).tz(props.userData.timezone_id)._d),
			weekStartDay: null,
			viewWeek: null,
			daysInWeek: null,
			isDaySame: false,
			scheduleData: []
		}
		if (props.userData.language == "gr") {
			moment.locale("de");
		} else if (props.userData.language == "sp") {
			moment.locale("es");
		} else {
			moment.locale(props.userData.language);
		}
	}

	loadData = (inbox_no = this.props.match.params.inbox_no) => {
		let data = {};
		data['from_date'] = moment(this.state.date).format("YYYY-MM-01");
		let endDate = moment(this.state.date).add(3, 'month')._d;
		data['end_date'] = moment(endDate).format("YYYY-") + (moment(endDate).format("MM")) + "-01";
		data['inbox_no'] = inbox_no;
		$.ajax({
			type: "GET",
			url: BASEURL + "/conversations/scheduled-messages",
			dataType: "json",
			data: {
				data: JSON.stringify(data)
			},
			success: (response) => {
				if (response.success) {
					this.setState({
						scheduleData: response.data
					}, () => {
						$("div").removeClass("focus-date");
						$("#date-" + moment(this.state.selectedMonthDate).format("YYYY-MM-DD")).addClass("focus-date");
					})
				}
			}
		})
	}

	weekMonthToggle = (e) => {
		$(".schedule-setting-toggle-button").removeClass('save-button');
		$(e.target).addClass('save-button');
	}

	componentWillMount() {
		checkTextCredits({checkCreditStatus: true, module_name:"conversations"}, (creditStatus) => {
			this.lowCreditNotification = showLowTextCreditNotification(creditStatus);
		});
		if (checkUserPermission("INBOX_" + this.props.match.params.inbox_no, this.props.userData, 1) && (checkUserPermission(`CONVERSATIONS_INBOX_${this.props.match.params.inbox_no}_VIEW` , this.props.userData, 0) || checkUserPermission(`CONVERSATIONS_INBOX_${this.props.match.params.inbox_no}_ADD` , this.props.userData, 0))) {
			$("#page-loading").show();
			$.ajax({
				type: "GET",
				url: BASEURL + "/conversations/scheduler-calendar-setting",
				// dataType: "json",
				/* data: {
					data: JSON.stringify({
						inbox_no: this.props.match.params.inbox_no
					})
				}, */
				complete: (jqXHR, textStatus) => {
					if(textStatus == "success" && jqXHR.responseJSON.success && jqXHR.responseJSON.data.length) {
						this.setState({ 
							viewWeek: jqXHR.responseJSON.data[0].viewWeek ? jqXHR.responseJSON.data[0].viewWeek : false, 
							daysInWeek: (jqXHR.responseJSON.data[0].days_in_week) ? jqXHR.responseJSON.data[0].days_in_week : 7, 
							weekStartDay: (jqXHR.responseJSON.data[0].week_start_day != null) ? jqXHR.responseJSON.data[0].week_start_day : 1,
						}, () => {
							$("#page-loading").hide();
						});
					} else {
						this.setState({ 
							viewWeek: false, 
							daysInWeek: 7, 
							weekStartDay: 1,
						}, () => {
							$("#page-loading").hide();
						});
					}
				}
			});
			this.loadData();
		}
	}

	componentWillUnmount() {
		if (window.location.hash.indexOf("#/conversations/inbox/") == -1) {
			if (this.lowCreditNotification) {
				this.lowCreditNotification.close();
			}
		}
		
		if ($('.jqx-popover').length) {
			$('.jqx-popover').remove();
		}
	}

	componentWillReceiveProps(nextProps) {
		if (!(checkUserPermission("INBOX_" + this.props.match.params.inbox_no, this.props.userData, 1))) {
			return;
		}
		if (this.props.match.params.inbox_no != nextProps.match.params.inbox_no) {
			this.loadData(nextProps.match.params.inbox_no);
			if ($('.jqx-popover').length) {
				$('.jqx-popover').remove();
			}
		}
	}

	onCalendarNavigate = (date) => {
		if (moment(date).format('YYYYMM') < moment(this.state.date).format('YYYYMM') || moment(date).format('YYYYMM') > moment(this.state.date).add(2, 'M').format('YYYYMM')) {
			this.setState({ date: date, selectedMonthDate: date }, () => {
				this.loadData();
				$("div").removeClass("focus-date");
				$("#date-" + moment(date).format("YYYY-MM-DD")).addClass("focus-date");
			});
		} else {
			this.setState({ selectedMonthDate: date }, () => {
				$("div").removeClass("focus-date");
				$("#date-" + moment(date).format("YYYY-MM-DD")).addClass("focus-date");
			})
		}
	}

	storeCalendarSetting = (options) => {
		if (!$.isEmptyObject(options)) {
			$.ajax({
				type: "PUT",
				url: BASEURL + "/conversations/scheduler-calendar-setting",
				dataType: "json",
				data: {
					data: JSON.stringify({
						// inbox_no: this.props.match.params.inbox_no,
						week_start_day: options.week_start_day,
						days_in_week: options.days_in_week,
						viewWeek: options.viewWeek
					})
				},
				success: (response) => {}
			});
		}
	}

	changeCalendar = (options) => {
		let flag = false;
		if (typeof options == "undefined") {
			flag = true;
			let viewWeek = false;
			if ($(".week-button").length && $(".week-button").hasClass("save-button")) {
				viewWeek = true;
			}
			var options = {
				setting: {
					viewWeek: viewWeek,
					weekStartDay: this.WeekStartDay.val(),
					daysInWeek: this.DaysInWeek.val()
				}
			}
		}
		if (!$.isEmptyObject(options)) {
			if (options.prev) {
				if (this.state.viewWeek) {
					this.state.date = moment(this.state.selectedMonthDate).subtract(7, 'days')._d;
					if (moment(this.state.date).month() != moment(this.state.selectedMonthDate).month()) {
						let startDate = moment(this.state.date).isoWeekday((this.state.weekStartDay) ? this.state.weekStartDay : 1)._d;
						startDate = moment(startDate).add(6, 'days')._d;
						if (moment(this.state.selectedMonthDate).format("DD") > moment(startDate).format("DD")) {
							this.state.date = startDate;
						} else {
							this.state.date = moment(this.state.date).endOf('month')._d
						}
					}
				} else {
					this.state.date = moment(this.state.selectedMonthDate).subtract(1, 'month')._d;
				}
				this.state.setting = { date: this.state.date, selectedMonthDate: this.state.date }
			} else if (options.next) {
				if (this.state.viewWeek) {
					this.state.date = moment(this.state.selectedMonthDate).add(7, 'days')._d;
					if (moment(this.state.date).month() != moment(this.state.selectedMonthDate).month()) {
						let startDate = moment(this.state.date).isoWeekday((this.state.weekStartDay) ? this.state.weekStartDay : 1)._d;
						if (moment(this.state.selectedMonthDate).format("DD") < moment(startDate).format("DD")) {
							this.state.date = startDate;
						} else {
							this.state.date = moment(this.state.date).startOf('month')._d
						}
					}
				} else {
					this.state.date = moment(this.state.selectedMonthDate).add(1, 'month')._d;
				}
				this.state.setting = { date: this.state.date, selectedMonthDate: this.state.date }
			} else if (!$.isEmptyObject(options.setting)) {
				this.state.setting = { date: this.state.date, selectedMonthDate: this.state.selectedMonthDate, ...options.setting }
			}
			this.setState({ ...this.state.setting },
				() => {
					this.loadData();
					$("#date-" + moment(this.state.selectedMonthDate).format("YYYY-MM-DD")).addClass('focus-date');
					if (flag) {
						this.storeCalendarSetting({week_start_day: this.WeekStartDay.val(), days_in_week: this.DaysInWeek.val(), viewWeek: options.setting.viewWeek})
					}
				});
		}
	}

	resetCalendarSetting = () => {
		this.DaysInWeek.clear();
		this.WeekStartDay.clear();
		$('.jqx-popover').css({ 'display': 'none' });
		this.setState({ viewWeek: false, daysInWeek: 7, weekStartDay: 1}, () => {
			$("div").removeClass("focus-date");
			$("#date-" + moment(this.state.selectedMonthDate).format("YYYY-MM-DD")).addClass("focus-date");
			this.storeCalendarSetting({ viewWeek: false, daysInWeek: null, weekStartDay: null })
		})
	}

	render() {
		const inbox_no = this.props.match.params.inbox_no;
		let key = Math.random();
		return (
			<div className="conversation-inbox">
				{
					(!(checkUserPermission("INBOX_" + this.props.match.params.inbox_no, this.props.userData, 1) && (checkUserPermission(`CONVERSATIONS_INBOX_${this.props.match.params.inbox_no}_VIEW` , this.props.userData, 0) || checkUserPermission(`CONVERSATIONS_INBOX_${this.props.match.params.inbox_no}_ADD` , this.props.userData, 0)))) ?
						<PageUnavailable />
						:
						<React.Fragment>
							<SubHeader header="CONVERSATIONS" active={`INBOX_${inbox_no}`} />
							<div className="content" style={{ overflowX: 'auto' }}>
								<div className="conversation-layout-card" style={{ minWidth: '750px' }}>
									<div className="conversation-main-panel-1">
										<div className="conversation-main-panel-toolbar" key={"conversation-main-panel-toolbar-" + inbox_no}>
											<Link to={`/conversations/inbox/${inbox_no}/messages/`}>
												<div className="conversation-main-panel-toolbar-links" title={lang("INBOX")}>
													<i className="fal fa-comment-alt"></i>
												</div>
											</Link>
											{
												(checkUserPermission('MESSAGE_SCHEDULAR', this.props.userData, 1) && (checkUserPermission('CONVERSATIONS_SCHEDULER_VIEW', this.props.userData) || checkUserPermission('CONVERSATIONS_SCHEDULER_ADD', this.props.userData) || checkUserPermission('CONVERSATIONS_SCHEDULER_EDIT', this.props.userData) || checkUserPermission('CONVERSATIONS_SCHEDULER_DELETE', this.props.userData))) ?
													<div className="conversation-main-panel-toolbar-links" title={lang("MESSAGE_SCHEDULER")}>
														<i className="fas active-panel fa-calendar"></i>
													</div>
													:
													null
											}
											{
												(checkUserPermission("CONVERSATIONS_CONTACT_GROUPS_VIEW", this.props.userData)) ?
													<Link to={`/conversations/inbox/${inbox_no}/groups/`}>
														<div className="conversation-main-panel-toolbar-links" title={lang("CONTACTS_GROUPS")}>
															<i className="fal fa-user"></i>
														</div>
													</Link>
													:
													''
											}
											<Link to={`/conversations/inbox/${inbox_no}/sent-messages/`}>
												<div className="conversation-main-panel-toolbar-links" title={lang("MASS_MESSAGES")}>
													<i className="fal fa-comment-alt-check"></i>
												</div>
											</Link>
											<div className="conversation-main-panel-toolbar-options">
												<i className="fal fa-cog" id={"schedule-setting-icon"} title={lang("CALENDAR_SETTING")} style={{ cursor: 'pointer', paddingRight: "10px" }}></i>
												<JqxPopover
													arrowOffsetValue={93}
													offset={{ left: -99, top: 0 }}
													ref={(JqxPopover) => { this.scheduleJqxPopover = JqxPopover }}
													selector={"#schedule-setting-icon"}
													position={'bottom'}
												>
													<div className="schedule-setting-popover">
														<div className="setting-toggle-button">
															<button onClick={(e) => this.weekMonthToggle(e)} className={"schedule-setting-toggle-button week-button " + (this.state.viewWeek ? " save-button " : "")}>{lang("WEEK")}</button>
															<button onClick={(e) => this.weekMonthToggle(e)} className={"schedule-setting-toggle-button month-button " + (!this.state.viewWeek ? " save-button " : "")}>{lang("MONTH")}</button>
														</div>
														<div className="setting-popover-content">
															<label>{lang("DAYS_IN_WEEK")}</label>
															<MultiSelectNestedCombobox
																ref={(MultiSelectNestedCombobox) => { this.DaysInWeek = MultiSelectNestedCombobox; }}
																id={"schedule-setting-days-in-week"}
																key={key}
																multiSelect={false}
																placeholder={lang('SELECT')}
																displayField={'days_in_week'}
																idField={'week_id'}
																source={[
																	{ days_in_week: '7', week_id: 7 },
																	{ days_in_week: '5', week_id: 5 }
																]}
																value={this.state.daysInWeek}
																isReadonly={true}
															/>
														</div>
														<div className="setting-popover-content">
															<label>{lang("WEEK_START_DAY")}</label>
															<MultiSelectNestedCombobox
																ref={(MultiSelectNestedCombobox) => { this.WeekStartDay = MultiSelectNestedCombobox; }}
																id={"schedule-setting-week-start-day"}
																key={key}
																multiSelect={false}
																placeholder={lang('SELECT')}
																displayField={'week_name'}
																idField={'week_id'}
																source={[
																	{ week_name: `${moment().isoWeekday(1).format('dddd')[0].toUpperCase()}${moment().isoWeekday(1).format('dddd').slice(1)}`, week_id: 1 },
																	{ week_name: `${moment().isoWeekday(2).format('dddd')[0].toUpperCase()}${moment().isoWeekday(2).format('dddd').slice(1)}`, week_id: 2 },
																	{ week_name: `${moment().isoWeekday(3).format('dddd')[0].toUpperCase()}${moment().isoWeekday(3).format('dddd').slice(1)}`, week_id: 3 },
																	{ week_name: `${moment().isoWeekday(4).format('dddd')[0].toUpperCase()}${moment().isoWeekday(4).format('dddd').slice(1)}`, week_id: 4 },
																	{ week_name: `${moment().isoWeekday(5).format('dddd')[0].toUpperCase()}${moment().isoWeekday(5).format('dddd').slice(1)}`, week_id: 5 },
																	{ week_name: `${moment().isoWeekday(6).format('dddd')[0].toUpperCase()}${moment().isoWeekday(6).format('dddd').slice(1)}`, week_id: 6 },
																	{ week_name: `${moment().isoWeekday(0).format('dddd')[0].toUpperCase()}${moment().isoWeekday(0).format('dddd').slice(1)}`, week_id: 0 },
																]}
																value={this.state.weekStartDay}
																isReadonly={true}
															/>
														</div>
														<hr />
														<div className="modal-footer calendar-setting-footer" style={{ padding: '20px 0px 10px 0px', height: '24px' }}>
															<button type="button" onClick={this.resetCalendarSetting}>{lang('RESET')}</button>
															<button type="button" className="save-button" onClick={() => { this.changeCalendar(); $('.jqx-popover').css({ 'display': 'none' }); }} >{lang('APPLY')}</button>
														</div>
													</div>
												</JqxPopover>
											</div>
										</div>
										<div className="conversation-main-panel-1-content">
											<div style={{ display: 'flex', width: '100%', height: '100%' }}>
												<CalendarNavigation
													date={this.state.date}
													onCalendarNavigate={this.onCalendarNavigate}
													changeCalendar={this.changeCalendar}
													weekStartDay={this.state.weekStartDay}
													daysInWeek={this.state.daysInWeek}
													data={this.state.scheduleData}
													userData={this.props.userData}
												/>
											</div>
										</div>
									</div>
									<div className="conversation-main-panel-2" style={{ minWidth: '751px', overflowY: 'hidden' }}>
										<ConversationScheduler
											date={this.state.selectedMonthDate}
											changeCalendar={this.changeCalendar}
											userData={this.props.userData}
											weekStartDay={this.state.weekStartDay}
											viewWeek={this.state.viewWeek}
											daysInWeek={this.state.daysInWeek}
											data={this.state.scheduleData}
											loadData={this.loadData}
											inbox_no={inbox_no}
										/>
									</div>
								</div>
							</div>
						</React.Fragment>
				}
			</div>
		)
	}
}

function mapStateToProps(state) {
	return { userData: state.userData }
}

export default connect(mapStateToProps)(ScheduleLayout)