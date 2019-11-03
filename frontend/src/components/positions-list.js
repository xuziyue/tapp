import React from "react";
import PropTypes from "prop-types";
import ReactTable from "react-table";
import { docApiPropTypes } from "../api/defs/doc-generation";
import { Badge } from "react-bootstrap";

const DEFAULT_COLUMNS = [
    { Header: "Position Code", accessor: "position_code" },
    { Header: "Position Title", accessor: "position_title" },
    { Header: "Hours", accessor: "est_hours_per_assignment" },
    { Header: "Start", accessor: "est_start_date" },
    { Header: "End", accessor: "est_end_date" },
    {
        Header: "Instructors",
        accessor: "instructors",
        Cell: props => (
            <React.Fragment>
                {props.value.map((instructor = {}) => {
                    const name = `${instructor.first_name} ${instructor.last_name}`;
                    return (
                        <Badge variant="secondary" className="mr-1" key={name}>
                            {name}
                        </Badge>
                    );
                })}
            </React.Fragment>
        )
    }
];

/**
 * List the instructors using a ReactTable. `columns` can be passed
 * in to customize columns/cell renderers.
 *
 * @export
 * @param {{instructors: object[], columns: object[]}} props
 * @returns
 */
export function PositionsList(props) {
    const { positions, columns = DEFAULT_COLUMNS } = props;
    return (
        <React.Fragment>
            <h3>Positions</h3>
            <ReactTable
                data={positions}
                columns={columns}
                showPagination={false}
                minRows={1}
            />
        </React.Fragment>
    );
}
PositionsList.propTypes = {
    positions: PropTypes.arrayOf(docApiPropTypes.position).isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({ Header: PropTypes.any.isRequired })
    )
};
export class PositionsListx extends React.Component {
    static propTypes = {
        positions: PropTypes.arrayOf(
            PropTypes.shape({
                position_code: PropTypes.string,
                position_title: PropTypes.string
            })
        ).isRequired
    };
    render() {
        const positions = this.props.positions;
        let positionsList = <div>No Positions...</div>;
        if (positions.length > 0) {
            positionsList = (
                <ul>
                    {positions.map(position => (
                        <li key={position.id}>
                            {position.position_code} {position.position_title}
                        </li>
                    ))}
                </ul>
            );
        }
        return (
            <div>
                <h3>Available Positions</h3>
                {positionsList}
            </div>
        );
    }
}
