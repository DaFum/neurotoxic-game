/*
 * (#1) Actual Updates: Extracted plug graphics to sub-components, removed TODO.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { CONNECTOR_TYPES } from '../constants.js'
import {
  XlrPlug,
  JackPlug,
  DcPlug,
  IecPlug,
  MidiPlug
} from './plug-graphics/index.js'

export const PlugGraphics = ({ type }) => {
  switch (type) {
    case 'xlr':
      return <XlrPlug />
    case 'jack':
      return <JackPlug />
    case 'dc':
      return <DcPlug />
    case 'iec':
      return <IecPlug />
    case 'midi':
      return <MidiPlug />
    default:
      return null
  }
}

PlugGraphics.propTypes = {
  type: PropTypes.oneOf(CONNECTOR_TYPES).isRequired
}
