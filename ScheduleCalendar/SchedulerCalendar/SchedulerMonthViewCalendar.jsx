import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { checkUserPermission, convertToUserTimezone } from "common/CommonFunctions.jsx";

import './SchedulerMonthViewCalendar.css';

export default class SchedulerMonthViewCalendar extends Component {
    constructor(props) {
        super(props);
        this.totalRow = 4;
        this.start;
        this.focusDate;
        this.userTimeFormat = 'HH:mm'
        if(this.props.userData && this.props.userData.time_format == '12') {
            this.userTimeFormat = 'hh:mm A';
        }
        this.schedulerViewPermission = (this.props.from != undefined &&  this.props.from == 'work-order') ? true : checkUserPermission("CONVERSATIONS_SCHEDULER_VIEW", this.props.userData);
        if (props.userData.language == "gr") {
			moment.locale("de");
		} else if (props.userData.language == "sp") {
			moment.locale("es");
		} else {
			moment.locale(props.userData.language);
		}
    }

    onSelectSlot = (date) => {
        if (typeof this.props.calendarNavigate == 'function') {
            this.props.calendarNavigate(date);
        }
    }

    scheduledInfoRenderer = (scheduled_date_time) => {
        let items = [];
        this.props.data[scheduled_date_time].map((record) => {
            if (this.props.from != undefined && this.props.from == 'work-order') {
                items.push(
                    <div className="scheduled-data" style={{borderLeft:`4px Solid ${record['status_color_code']}`}} key={record['_id']}
                    onClick={()=>{
                        if(typeof this.props.onScheduledItemClick == "function") {
                            this.props.onScheduledItemClick(record);
                        }
                    }}>
                        <i className="fal fa-clock"></i>{moment(record['current_status_date']).format(this.userTimeFormat)}&nbsp;&nbsp;
                        <div>{'#' + record['work_order_no']}</div>
                        <div>{record['work_order_type']}</div>
                        <div>{record['assigned_to']}</div>
                    </div>
                )
            } else {
                items.push(
                    <div className="scheduled-data" key={record['_id']}
                    onClick={()=>{
                        if(typeof this.props.onScheduledItemClick == "function") {
                            this.props.onScheduledItemClick(record);
                        }
                    }}>
                        <i className="fal fa-clock"></i>{moment(record['scheduled_date_time']).format(this.userTimeFormat)}&nbsp;&nbsp;<i title={(record.isMsgSent == 2)? lang("INSUFFICIENT_CREDITS_MESSAGE") : ""} className={"fal fa-exclamation-circle " + (record.isMsgSent == 2 ? "scheduled-failed-message" : " d-none")}></i>
                        <div>{record['name']}</div>
                    </div>
                )
            }
        });
        return <Scrollbars key={Math.random()}
            renderTrackHorizontal={props => <div {...props} style={{ display: 'none' }} className="track-horizontal" />}
        >
            {
                items
            }
        </Scrollbars>
    }

    getCalendarNavigationRow = (getlastRow = false) => {
        let getCalendarRow = [];
        let date = (getlastRow) ? this.start : moment(this.start).subtract(1, 'days')._d;
        for (let j = 0; j < (this.totalRow + 1); j++) {
            for (let i = 0; i < this.props.daysInWeek; i++) {
                date = moment(date).add(1, 'days')._d;
                let selectedDate = date;
                let isOffRange = (moment(this.props.date).month() === moment(date).month()) ? false : true;
                getCalendarRow.push(
                    <div className={ ((moment(new Date((moment(new Date()).tz(this.props.userData.timezone_id)._d))).format("YYYY-MM-DD")==moment(date).format("YYYY-MM-DD") && moment(this.props.date).month() === moment(date).month()) ? "highlight-background" : "" ) + " navigation-date-cell "} id={((isOffRange) ? "offRannge-date-" : "date-") + moment(selectedDate).format("YYYY-MM-DD")} key={`navigation-date-cell`+date.getTime()} onClick={(e) => { this.onSelectSlot(selectedDate) }}>
                        {(!isOffRange) ?
                            <div className={((this.schedulerViewPermission && this.props.data[moment(selectedDate).format("YYYY-MM-DD")] && this.props.data[moment(selectedDate).format("YYYY-MM-DD")].length) ? " highlight-date " : "") + " navigation-month-date "} >
                                {moment(date).format('D')}
                            </div>
                            :
                            <div className="navigation-month-date-off-range" >
                                {moment(date).format('D')}
                            </div>
                        }
                    </div>
            )
        }
            (this.props.daysInWeek === 5) ? date = moment(date).add(2, 'days')._d : '';
        }
        this.start = date;
        return getCalendarRow;
    }

    getCalendarRow = (getlastRow = false) => {
        let getCalendarRow = [];
        let date = (getlastRow) ? this.start : moment(this.start).subtract(1, 'days')._d;
        for (let j = 0; j < (this.totalRow + 1); j++) {
            for (let i = 0; i < this.props.daysInWeek; i++) {
                date = moment(date).add(1, 'days')._d;
                let selectedDate = date;
                getCalendarRow.push(
                    <div className={ ((moment(date).format("YYYY-MM-DD")==moment(this.props.date).format("YYYY-MM-DD")) ? "highlight-background" : "") + " date-cell "} id={"date-cell-" + moment(selectedDate).format("YYYY-MM-DD")} key={`date-cell`+date.getTime()}>
                        {(moment(this.props.date).month() === moment(date).month()) ?
                            <React.Fragment>
                                <div className="month-date">
                                    {moment(date).format('D')}
                                </div>
                                {
                                    (this.schedulerViewPermission) ?
                                        <div  style={{ height: 'calc(100% - 40px)', marginTop: '5px' }}>
                                            {
                                                (this.props.data[moment(selectedDate).format("YYYY-MM-DD")] && this.props.data[moment(selectedDate).format("YYYY-MM-DD")].length) ?
                                                    this.scheduledInfoRenderer(moment(selectedDate).format("YYYY-MM-DD"))
                                                    :
                                                    null
                                            }
                                        </div>
                                        :
                                        null
                                }
                            </React.Fragment>
                            :
                            <div className="month-date month-date-off-range">
                                {moment(date).format('D')}
                            </div>
                        }
                    </div>)
            }
            (this.props.daysInWeek == 5) ? date = moment(date).add(2, 'days')._d : '';
        }
        this.start = date;
        this.totalRow = 4;
        return getCalendarRow;
    }

    getCalendarLastRow = () => {
        this.totalRow = 0;
        if (this.props.calendarNavigation) {
            return this.getCalendarNavigationRow(true)
        } else {
            return this.getCalendarRow(true)
        }
    }

    componentDidUpdate() {
        if ($("#date-cell-" + moment(this.props.date).format("YYYY-MM-DD")).length) {
            $("#date-cell-" + moment(this.props.date).format("YYYY-MM-DD"))[0].scrollIntoView(false);
        }
    }

    componentDidMount() {
        if ($("#date-cell-" + moment(this.props.date).format("YYYY-MM-DD")).length) {
            $("#date-cell-" + moment(this.props.date).format("YYYY-MM-DD"))[0].scrollIntoView(false);
        }
    }

    render() {
        this.start = moment(this.props.date).startOf('month').startOf('isoWeek').format();
        this.start = moment(this.start).isoWeekday(this.props.weekStartDay)._d;
        let monthLastDate = Number(moment(this.props.date).endOf('month').format('D'));
        return (
            <div className={(this.props.daysInWeek == 5) ? "working-date-cell" : this.props.className}>
                <React.Fragment>
                    {
                        (this.props.calendarNavigation) ?
                            <React.Fragment>
                                {
                                    (this.getCalendarNavigationRow())
                                }
                                {(((monthLastDate - Number(moment(this.start).format("D"))) < 5) && (monthLastDate - Number(moment(this.start).format("D"))) > 0) ? this.getCalendarLastRow() : ''}
                            </React.Fragment>

                            :
                            <React.Fragment>
                                <div className={(this.props.daysInWeek == 5) ? "working-calendar-grid" : "calendar-grid" } style={{ marginTop: "5px" }}>
                                    {
                                        (this.getCalendarRow())
                                    }
                                    {(((monthLastDate - Number(moment(this.start).format("D"))) < 5) && (monthLastDate - Number(moment(this.start).format("D"))) > 0) ? this.getCalendarLastRow() : ''}
                                </div>
                            </React.Fragment>
                    }
                </React.Fragment>
            </div>
        );
    }
}

SchedulerMonthViewCalendar.defaultProps = {
    weekDayFormat: "dddd",
    calendarNavigation: false,
    className: "calendar",
}
