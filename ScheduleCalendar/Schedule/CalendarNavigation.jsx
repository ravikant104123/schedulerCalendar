import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import SchedulerMonthViewCalendar from 'components/Common/SchedulerCalendar/SchedulerMonthViewCalendar.jsx';

import './CalendarNavigation.css'

export default class CalendarNavigation extends Component {
    constructor(props) {
        super(props);
    }

    getWeekHeader = () => {
        let weekHeaderContainer = [];
        let daysInWeek = this.props.daysInWeek  ? this.props.daysInWeek : 7;
        let weekStartDay = this.props.weekStartDay !== null ? this.props.weekStartDay : 1;
        for (let i = 0; i < daysInWeek; i++) {
            weekHeaderContainer.push(
                <div className="week-day-header" style={{ /* padding: "10px 0px", */ background: '#FFF' }}>
                    {moment().isoWeekday(weekStartDay+i).format('dd')[0]}
                </div>
            );
        }
        return weekHeaderContainer;
    }

    getCalendars = () => {
        let calendars = [];
        for (let i = 0; i < this.props.count; i++) {
            calendars.push(
                <div className="calendar-navigation-calendar-wrapper" key={Math.random()}>
                    <div className="display-center month-title-bar" key={Math.random()} style={(i > 0) ? { marginTop: "20px" } : {}}>
                        {moment(moment(this.props.date).add(i, 'M')._d).format('MMMM Y')}
                    </div>
                    <div className={(this.props.daysInWeek == 5) ? "working-calendar-navigation-grid" : "calendar-navigation-grid"}>
                        <div className={"week-day-header-container"} >
                            {
                                this.getWeekHeader()
                            }
                        </div>
                        <div className={"date-container" }>
                            <SchedulerMonthViewCalendar
                                key={Math.random()}
                                className={'calendar-navigation'}
                                style={{ height: "228px" }}
                                date={moment(this.props.date).add(i, 'M')._d}
                                calendarNavigation={true}
                                weekDayFormat={"dd"}
                                weekStartDay={this.props.weekStartDay}
                                daysInWeek={this.props.daysInWeek}
                                calendarNavigate={this.props.onCalendarNavigate}
                                data={this.props.data}
                                userData={this.props.userData}
                                from={this.props.from}
                            />
                        </div>
                    </div>
                </div>)
        }
        return calendars;
    }

    render() {
        return (
            <div className="calendar-navigation-container">
                {
                    (this.props.viewWeek !== null && this.props.weekStartDay !== null && this.props.daysInWeek !== null) ?
                        <Scrollbars
                            autoHide={true}
                            renderTrackHorizontal={props => <div {...props} style={{display: 'none'}} className="track-horizontal"/>}
                        >
                            <div>
                                {
                                    (this.getCalendars())
                                }
                            </div>
                        </Scrollbars>
                        :
                        null
                }
            </div>
        )
    }
}

CalendarNavigation.defaultProps = {
    count: 3
}
