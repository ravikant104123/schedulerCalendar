import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { checkUserPermission } from "common/CommonFunctions.jsx";

import './SchedulerWeekViewCalendar.css';

export default class SchedulerWeekViewCalendar extends Component {
    constructor(props) {
        super(props);
        this.weekStartDay= this.props.weekStartDay;
        this.start;
        this.last;
        this.lastIndex;
        this.selectedIndex;
        this.className = "weekly-date-cell";
        this.userTimeFormat = 'HH:mm'
        if(this.props.userData && this.props.userData.time_format == '12') {
            this.userTimeFormat = 'hh:mm A';
        }
        this.schedulerViewPermission = (this.props.from != undefined &&  this.props.from == 'work-order') ? true : (this.props.userData) ? checkUserPermission("CONVERSATIONS_SCHEDULER_VIEW", this.props.userData) : false;
        if (props.userData.language == "gr") {
			moment.locale("de");
		} else if (props.userData.language == "sp") {
			moment.locale("es");
		} else {
			moment.locale(props.userData.language);
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
        return <Scrollbars key={Math.random()} style={{height: "calc(100% - 55px)"}}
            renderTrackHorizontal={props => <div {...props} style={{ display: 'none' }} className="track-horizontal" />}
        >
            {
                items
            }
        </Scrollbars>
    }

    getWeeklyCalendars = () => {
        let weeklyCalendar = [];
        let date = moment(this.start).subtract(1, 'days')._d;
        for (let i = 0; i < this.props.daysInWeek; i++) {
            date = moment(date).add(1, 'days')._d;
            weeklyCalendar.push(
                     <div className={((moment(date).format("YYYY-MM-DD")==moment(this.props.date).format("YYYY-MM-DD")) ? " highlight-background " : "") + this.className} key={Math.random()}>
                        {(moment(this.props.date).month() === moment(date).month())?
                            <React.Fragment>
                                <div className="month-date" style={{ padding: "8px 10px 8px 10px", fontWeight: 300 }}>
                                    {moment(date).format('D')}
                                </div>
                                {
                                    (this.schedulerViewPermission && this.props.data[moment(date).format("YYYY-MM-DD")] && this.props.data[moment(date).format("YYYY-MM-DD")].length) ?
                                        this.scheduledInfoRenderer(moment(date).format("YYYY-MM-DD"))
                                        :
                                        null
                                }
                            </React.Fragment>
                            :
                            <div className="month-date month-date-off-range" style={{ padding: "8px 10px 8px 10px" }}>
                                {moment(date).format('D')}
                            </div>
                        }
                    </div>
                )
        }
        (this.props.daysInWeek === 5)? this.last = moment(date).add(2, 'days')._d : this.last = date;
        return weeklyCalendar;
    }

    render() {
        this.className = "weekly-date-cell";
        if (this.props.daysInWeek === 5) {
            this.className = "working-weekly-date-cell"
        }
        this.weekStartDay= this.props.weekStartDay;
        if (this.weekStartDay===null) {
            this.weekStartDay = 1;
        }
        this.start = moment(this.props.date).isoWeekday(this.weekStartDay)._d;
        return (
            <div className={(this.className == "working-weekly-date-cell")?"working-week-calendar-grid" : "week-calendar-grid"} style={{ marginTop: "5px", height: "calc(100% - 15px)"}}>
                {
                    (this.getWeeklyCalendars())
                }
            </div>
        );
    }
}

SchedulerWeekViewCalendar.defaultProps = {
    daysInWeek: 7,
}
