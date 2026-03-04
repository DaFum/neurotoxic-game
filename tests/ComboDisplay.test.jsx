import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ComboDisplay } from '../src/components/hud/ComboDisplay.jsx'
import React from 'react'

test('ComboDisplay renders zero combo', () => {
  render(<ComboDisplay combo={0} accuracy={100} />)
  expect(screen.getByText('0x')).toBeInTheDocument()
  expect(screen.getByText('0x').className).toContain('text-(--ash-gray)/50')
  expect(screen.queryByText('LOW ACC')).not.toBeInTheDocument()
})

test('ComboDisplay renders low combo', () => {
  render(<ComboDisplay combo={10} accuracy={100} />)
  expect(screen.getByText('10x')).toBeInTheDocument()
  expect(screen.getByText('10x').className).toContain('text-(--toxic-green)')
})

test('ComboDisplay renders medium combo', () => {
  render(<ComboDisplay combo={25} accuracy={100} />)
  expect(screen.getByText('25x')).toBeInTheDocument()
  expect(screen.getByText('25x').className).toContain('text-(--warning-yellow)')
})

test('ComboDisplay renders high combo', () => {
  render(<ComboDisplay combo={60} accuracy={100} />)
  expect(screen.getByText('60x')).toBeInTheDocument()
  expect(screen.getByText('60x').className).toContain('text-(--blood-red)')
  expect(screen.getByText('60x').className).toContain('animate-pulse')
})

test('ComboDisplay renders LOW ACC warning when accuracy is low', () => {
  render(<ComboDisplay combo={10} accuracy={65} />)
  expect(screen.getByText('LOW ACC')).toBeInTheDocument()
})
