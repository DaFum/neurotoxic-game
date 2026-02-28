import React from 'react'
import PropTypes from 'prop-types'
import { withTranslation } from 'react-i18next'
import { GlitchButton } from './GlitchButton'
import { VoidSkullIcon } from './shared/Icons'

class ErrorBoundaryComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReboot = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props
      return (
        <div
          className='flex flex-col items-center justify-center fixed inset-0 bg-(--void-black) text-(--blood-red) p-8 relative'
          style={{ zIndex: 'var(--z-crash)' }}
        >
          <VoidSkullIcon className="w-32 h-32 text-(--blood-red) animate-pulse mb-6" />

          <h1 className='text-6xl font-[Metal_Mania] mb-4'>{t('ui:crash.title', 'SYSTEM FAILURE')}</h1>
          <p className='text-(--toxic-green) font-mono mb-8'>
            {t('ui:crash.message', 'The simulation has crashed. Reboot required.')}
          </p>

          {globalThis.__IMPORT_META_ENV__?.DEV && (
            <div className='bg-(--blood-red)/20 border border-(--blood-red) p-4 mb-8 w-full max-w-2xl overflow-auto max-h-64 text-xs font-mono'>
              <p className='font-bold mb-2'>
                {this.state.error && this.state.error.toString()}
              </p>
              <pre className='whitespace-pre-wrap'>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}

          <GlitchButton onClick={this.handleReboot} variant='danger'>
            {t('ui:crash.rebootButton', 'REBOOT SYSTEM')}
          </GlitchButton>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundaryComponent.propTypes = {
  children: PropTypes.node.isRequired,
  t: PropTypes.func.isRequired
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryComponent)
